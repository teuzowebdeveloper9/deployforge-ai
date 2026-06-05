import { Module } from "@nestjs/common";
import { loadConfig } from "../../shared/config/app.config";
import { AUTH_PROVIDER } from "./application/ports/auth-provider.port";
import { DevAuthProvider } from "./infrastructure/dev-auth.provider";
import { GatewayAuthProvider } from "./infrastructure/gateway-auth.provider";

@Module({
  providers: [
    DevAuthProvider,
    GatewayAuthProvider,
    {
      provide: AUTH_PROVIDER,
      useFactory: (dev: DevAuthProvider, gateway: GatewayAuthProvider) => {
        return loadConfig().authProvider === "gateway" ? gateway : dev;
      },
      inject: [DevAuthProvider, GatewayAuthProvider]
    }
  ],
  exports: [AUTH_PROVIDER]
})
export class AuthModule {}
