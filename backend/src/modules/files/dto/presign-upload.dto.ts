import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class PresignUploadDto {
  @IsString()
  filename!: string;

  @IsString()
  mimeType!: string;

  @IsInt()
  @Min(1)
  size!: number;

  @IsOptional()
  @IsString()
  checksum?: string;
}
