import { Module } from "@nestjs/common";
import { AUTH_PROVIDER } from "./application/ports/auth-provider.port";
import { DevAuthProvider } from "./infrastructure/dev-auth.provider";

@Module({
  providers: [
    DevAuthProvider,
    {
      provide: AUTH_PROVIDER,
      useExisting: DevAuthProvider
    }
  ],
  exports: [AUTH_PROVIDER]
})
export class AuthModule {}
