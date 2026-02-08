import { IsEnum, IsOptional, IsString } from "class-validator";
import { UserRole } from "../domain/user-role.enum";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  isActive?: boolean;
}
