import { IsEmail, IsEnum, IsString, MinLength } from "class-validator";
import { UserRole } from "../domain/user-role.enum";

export class CreateUserDto {
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
