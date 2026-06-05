import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { loadConfig } from "../../shared/config/app.config";
import { PrismaService } from "../../shared/database/prisma.service";
import { createAccessToken, verifyAccessToken } from "../../shared/security/access-token";
import { hashPassword, verifyPassword } from "../../shared/security/passwords";
import { createRefreshToken, hashRefreshToken } from "../../shared/security/refresh-tokens";
import { LoginDto } from "./dtos/login.dto";
import { RegisterDto } from "./dtos/register.dto";

export interface RequestMetadata {
  userAgent?: string;
  ipAddress?: string;
}

export interface AuthContext {
  userId: string;
  email: string;
  name: string | null;
  organizationId: string;
  role: string;
  plan: string;
  sessionId: string;
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  status: string;
}

interface MembershipWithOrgRow {
  organization_id: string;
  role: string;
  org_name: string;
  org_plan: string;
  org_status: string;
}

interface RefreshSessionRow {
  id: string;
  user_id: string;
  organization_id: string;
  family_id: string;
  expires_at: Date;
  revoked_at: Date | null;
  user_email: string;
  user_name: string | null;
  user_status: string;
  org_name: string;
  org_plan: string;
  org_status: string;
}

@Injectable()
export class AuthService {
  private readonly config = loadConfig();

  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto, metadata: RequestMetadata) {
    const email = this.normalizeEmail(dto.email);
    const passwordHash = await hashPassword(dto.password);
    const organizationName = this.cleanName(dto.organizationName || `${email.split("@")[0]}'s organization`);
    const user = {
      id: randomUUID(),
      email,
      passwordHash,
      name: dto.name?.trim() || null
    };
    const organization = {
      id: randomUUID(),
      name: organizationName,
      slug: this.slugWithSuffix(organizationName),
      plan: "FREE"
    };
    const membership = {
      id: randomUUID(),
      role: "OWNER"
    };

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`
          INSERT INTO auth_users (id, email, password_hash, name)
          VALUES (${user.id}, ${user.email}, ${user.passwordHash}, ${user.name})
        `;
        await tx.$executeRaw`
          INSERT INTO organizations (id, name, slug, plan)
          VALUES (${organization.id}, ${organization.name}, ${organization.slug}, ${organization.plan})
        `;
        await tx.$executeRaw`
          INSERT INTO organization_members (id, user_id, organization_id, role)
          VALUES (${membership.id}, ${user.id}, ${organization.id}, ${membership.role})
        `;
      });

      return this.issueTokens(
        {
          user,
          organization,
          membership
        },
        metadata
      );
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("User already exists");
      }
      throw error;
    }
  }

  async login(dto: LoginDto, metadata: RequestMetadata) {
    const email = this.normalizeEmail(dto.email);
    const users = await this.prisma.$queryRaw<UserRow[]>`
      SELECT id, email, password_hash, name, status
      FROM auth_users
      WHERE email = ${email}
      LIMIT 1
    `;
    const user = users[0];

    if (!user || user.status !== "ACTIVE" || !(await verifyPassword(dto.password, user.password_hash))) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const memberships = await this.prisma.$queryRaw<MembershipWithOrgRow[]>`
      SELECT
        om.organization_id,
        om.role,
        o.name AS org_name,
        o.plan AS org_plan,
        o.status AS org_status
      FROM organization_members om
      JOIN organizations o ON o.id = om.organization_id
      WHERE om.user_id = ${user.id}
      ORDER BY om.created_at ASC
    `;
    const membership = dto.organizationId
      ? memberships.find((candidate) => candidate.organization_id === dto.organizationId)
      : memberships[0];

    if (!membership || membership.org_status !== "ACTIVE") {
      throw new UnauthorizedException("Invalid credentials");
    }

    return this.issueTokens(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        organization: {
          id: membership.organization_id,
          name: membership.org_name,
          plan: membership.org_plan
        },
        membership: {
          role: membership.role
        }
      },
      metadata
    );
  }

  async refresh(refreshToken: string, metadata: RequestMetadata) {
    const tokenHash = hashRefreshToken(refreshToken, this.config.refreshTokenPepper);
    const sessions = await this.prisma.$queryRaw<RefreshSessionRow[]>`
      SELECT
        rs.id,
        rs.user_id,
        rs.organization_id,
        rs.family_id,
        rs.expires_at,
        rs.revoked_at,
        au.email AS user_email,
        au.name AS user_name,
        au.status AS user_status,
        o.name AS org_name,
        o.plan AS org_plan,
        o.status AS org_status
      FROM refresh_sessions rs
      JOIN auth_users au ON au.id = rs.user_id
      JOIN organizations o ON o.id = rs.organization_id
      WHERE rs.refresh_token_hash = ${tokenHash}
      LIMIT 1
    `;
    const session = sessions[0];

    if (!session) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    if (session.revoked_at) {
      await this.revokeFamily(session.family_id);
      throw new UnauthorizedException("Invalid refresh token");
    }
    if (session.expires_at <= new Date() || session.user_status !== "ACTIVE" || session.org_status !== "ACTIVE") {
      await this.revokeFamily(session.family_id);
      throw new UnauthorizedException("Invalid refresh token");
    }

    const membership = await this.membership(session.user_id, session.organization_id);
    if (!membership) {
      await this.revokeFamily(session.family_id);
      throw new UnauthorizedException("Invalid refresh token");
    }

    const nextToken = createRefreshToken();
    const nextHash = hashRefreshToken(nextToken, this.config.refreshTokenPepper);
    const nextSessionId = randomUUID();
    const now = new Date();
    const expiresAt = this.refreshExpiry();

    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE refresh_sessions
        SET revoked_at = ${now}, replaced_by_hash = ${nextHash}, updated_at = ${now}
        WHERE id = ${session.id}
      `;
      await tx.$executeRaw`
        INSERT INTO refresh_sessions (
          id, user_id, organization_id, family_id, refresh_token_hash, user_agent, ip_address, expires_at
        )
        VALUES (
          ${nextSessionId}, ${session.user_id}, ${session.organization_id}, ${session.family_id}, ${nextHash},
          ${metadata.userAgent}, ${metadata.ipAddress}, ${expiresAt}
        )
      `;
    });

    return this.tokenResponse({
      user: {
        id: session.user_id,
        email: session.user_email,
        name: session.user_name
      },
      organization: {
        id: session.organization_id,
        name: session.org_name,
        plan: session.org_plan
      },
      membership,
      sessionId: nextSessionId,
      refreshToken: nextToken
    });
  }

  async logout(refreshToken: string) {
    const tokenHash = hashRefreshToken(refreshToken, this.config.refreshTokenPepper);
    await this.prisma.$executeRaw`
      UPDATE refresh_sessions
      SET revoked_at = ${new Date()}, updated_at = ${new Date()}
      WHERE refresh_token_hash = ${tokenHash} AND revoked_at IS NULL
    `;
    return { status: "ok" };
  }

  async verifyBearer(accessToken: string): Promise<AuthContext> {
    const claims = verifyAccessToken(accessToken, this.config);
    const sessions = await this.prisma.$queryRaw<RefreshSessionRow[]>`
      SELECT
        rs.id,
        rs.user_id,
        rs.organization_id,
        rs.family_id,
        rs.expires_at,
        rs.revoked_at,
        au.email AS user_email,
        au.name AS user_name,
        au.status AS user_status,
        o.name AS org_name,
        o.plan AS org_plan,
        o.status AS org_status
      FROM refresh_sessions rs
      JOIN auth_users au ON au.id = rs.user_id
      JOIN organizations o ON o.id = rs.organization_id
      WHERE rs.id = ${claims.sid}
      LIMIT 1
    `;
    const session = sessions[0];
    if (!session || session.revoked_at || session.expires_at <= new Date()) {
      throw new UnauthorizedException("Invalid access token");
    }

    const membership = await this.membership(claims.sub, claims.orgId);
    if (!membership || session.user_status !== "ACTIVE" || session.org_status !== "ACTIVE") {
      throw new UnauthorizedException("Invalid access token");
    }

    return {
      userId: session.user_id,
      email: session.user_email,
      name: session.user_name,
      organizationId: session.organization_id,
      role: membership.role,
      plan: session.org_plan,
      sessionId: session.id
    };
  }

  private async issueTokens(
    input: {
      user: { id: string; email: string; name: string | null };
      organization: { id: string; name: string; plan: string };
      membership: { role: string };
    },
    metadata: RequestMetadata
  ) {
    const refreshToken = createRefreshToken();
    const sessionId = randomUUID();
    await this.prisma.$executeRaw`
      INSERT INTO refresh_sessions (
        id, user_id, organization_id, family_id, refresh_token_hash, user_agent, ip_address, expires_at
      )
      VALUES (
        ${sessionId}, ${input.user.id}, ${input.organization.id}, ${randomUUID()},
        ${hashRefreshToken(refreshToken, this.config.refreshTokenPepper)}, ${metadata.userAgent},
        ${metadata.ipAddress}, ${this.refreshExpiry()}
      )
    `;

    return this.tokenResponse({ ...input, sessionId, refreshToken });
  }

  private tokenResponse(input: {
    user: { id: string; email: string; name: string | null };
    organization: { id: string; name: string; plan: string };
    membership: { role: string };
    sessionId: string;
    refreshToken: string;
  }) {
    const access = createAccessToken(
      {
        userId: input.user.id,
        email: input.user.email,
        name: input.user.name,
        organizationId: input.organization.id,
        role: input.membership.role,
        plan: input.organization.plan,
        sessionId: input.sessionId
      },
      this.config
    );

    return {
      accessToken: access.token,
      accessTokenExpiresAt: access.expiresAt.toISOString(),
      expiresIn: this.config.accessTokenTtlSeconds,
      refreshToken: input.refreshToken,
      user: {
        id: input.user.id,
        email: input.user.email,
        name: input.user.name
      },
      organization: {
        id: input.organization.id,
        name: input.organization.name,
        plan: input.organization.plan
      },
      role: input.membership.role
    };
  }

  private async membership(userId: string, organizationId: string): Promise<{ role: string } | null> {
    const rows = await this.prisma.$queryRaw<Array<{ role: string }>>`
      SELECT role
      FROM organization_members
      WHERE user_id = ${userId} AND organization_id = ${organizationId}
      LIMIT 1
    `;
    return rows[0] ?? null;
  }

  private async revokeFamily(familyId: string) {
    await this.prisma.$executeRaw`
      UPDATE refresh_sessions
      SET revoked_at = ${new Date()}, updated_at = ${new Date()}
      WHERE family_id = ${familyId} AND revoked_at IS NULL
    `;
  }

  private refreshExpiry() {
    return new Date(Date.now() + this.config.refreshTokenTtlDays * 24 * 60 * 60 * 1000);
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private cleanName(name: string) {
    return name.replace(/\s+/g, " ").trim().slice(0, 120) || "DeployForge Organization";
  }

  private slugWithSuffix(name: string) {
    const base =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 48) || "organization";
    return `${base}-${randomUUID().slice(0, 8)}`;
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
    return error.code === "P2002" || (error.code === "P2010" && String(error.meta?.code) === "23505");
  }
}
