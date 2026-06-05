import { Module } from "@nestjs/common";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthController } from "./health.controller";
import { PrismaService } from "./shared/database/prisma.service";

@Module({
  imports: [AuthModule],
  controllers: [HealthController],
  providers: [PrismaService]
})
export class AppModule {}
