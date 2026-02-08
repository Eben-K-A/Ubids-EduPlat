import { IsInt, IsString, Min } from "class-validator";

export class PresignUploadDto {
  @IsString()
  filename!: string;

  @IsString()
  mimeType!: string;

  @IsInt()
  @Min(1)
  size!: number;
}
