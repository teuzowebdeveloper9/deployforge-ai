CREATE TABLE "auth_users" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "password_hash" TEXT NOT NULL,
  "name" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "organizations" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "plan" TEXT NOT NULL DEFAULT 'FREE',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "organization_members" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "organization_id" TEXT NOT NULL REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "role" TEXT NOT NULL DEFAULT 'MEMBER',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "organization_members_user_id_organization_id_key" ON "organization_members"("user_id", "organization_id");

CREATE TABLE "refresh_sessions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "organization_id" TEXT NOT NULL REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "family_id" TEXT NOT NULL,
  "refresh_token_hash" TEXT NOT NULL UNIQUE,
  "replaced_by_hash" TEXT,
  "user_agent" TEXT,
  "ip_address" TEXT,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "refresh_sessions_user_id_idx" ON "refresh_sessions"("user_id");
CREATE INDEX "refresh_sessions_family_id_idx" ON "refresh_sessions"("family_id");
