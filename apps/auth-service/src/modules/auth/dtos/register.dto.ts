import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { passwordPolicyMessage } from "../../../shared/security/password-policy";
import { IsStrongPassword } from "./strong-password.validator";

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  @IsStrongPassword({ message: passwordPolicyMessage() })
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  organizationName?: string;
}
