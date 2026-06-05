import { Body, Controller, Get, Headers, Post, UnauthorizedException } from "@nestjs/common";
import { bearerToken } from "../../shared/security/safe-headers";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dtos/login.dto";
import { LogoutDto } from "./dtos/logout.dto";
import { RefreshTokenDto } from "./dtos/refresh-token.dto";
import { RegisterDto } from "./dtos/register.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto, @Headers() headers: Record<string, string | string[] | undefined>) {
    return this.auth.register(dto, this.metadata(headers));
  }

  @Post("login")
  login(@Body() dto: LoginDto, @Headers() headers: Record<string, string | string[] | undefined>) {
    return this.auth.login(dto, this.metadata(headers));
  }

  @Post("refresh")
  refresh(@Body() dto: RefreshTokenDto, @Headers() headers: Record<string, string | string[] | undefined>) {
    return this.auth.refresh(dto.refreshToken, this.metadata(headers));
  }

  @Post("logout")
  logout(@Body() dto: LogoutDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @Get("me")
  me(@Headers() headers: Record<string, string | string[] | undefined>) {
    const token = bearerToken(headers);
    if (!token) throw new UnauthorizedException("Bearer token required");
    return this.auth.verifyBearer(token);
  }

  private metadata(headers: Record<string, string | string[] | undefined>) {
    const userAgent = this.header(headers, "user-agent");
    const forwardedFor = this.header(headers, "x-forwarded-for");
    return {
      userAgent,
      ipAddress: forwardedFor?.split(",")[0]?.trim()
    };
  }

  private header(headers: Record<string, string | string[] | undefined>, name: string) {
    const value = headers[name] ?? headers[name.toLowerCase()];
    return Array.isArray(value) ? value[0] : value;
  }
}
