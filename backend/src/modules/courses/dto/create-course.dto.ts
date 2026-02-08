import { IsString } from "class-validator";

export class CreateCourseDto {
  @IsString()
  code!: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;
}
