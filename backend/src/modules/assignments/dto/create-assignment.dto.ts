import { IsDateString, IsInt, IsString, Min } from "class-validator";

export class CreateAssignmentDto {
  @IsString()
  courseId!: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsDateString()
  dueDate!: string;

  @IsInt()
  @Min(1)
  points!: number;
}
