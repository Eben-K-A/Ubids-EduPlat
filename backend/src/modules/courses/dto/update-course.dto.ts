import { IsOptional, IsString } from "class-validator";

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
