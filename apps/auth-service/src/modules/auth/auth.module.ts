import { Module } from "@nestjs/common";
import { PrismaService } from "../../shared/database/prisma.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { InternalAuthController } from "./internal-auth.controller";

@Module({
  controllers: [AuthController, InternalAuthController],
  providers: [AuthService, PrismaService],
  exports: [AuthService]
})
export class AuthModule {}
