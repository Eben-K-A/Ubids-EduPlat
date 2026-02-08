import { IsEmail, IsEnum, IsString, MinLength } from "class-validator";
import { UserRole } from "../../users/domain/user-role.enum";

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsString()
  @MinLength(8)
  password!: string;
}
