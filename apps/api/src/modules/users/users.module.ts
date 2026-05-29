import { Module } from "@nestjs/common";
import { PrismaUsersRepository } from "./infrastructure/persistence/prisma-users.repository";

@Module({
  providers: [PrismaUsersRepository],
  exports: [PrismaUsersRepository]
})
export class UsersModule {}
