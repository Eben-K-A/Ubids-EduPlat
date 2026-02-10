import { IsArray, IsInt, IsOptional, IsString, Min } from "class-validator";

export class MultipartInitDto {
  @IsString()
  filename!: string;

  @IsString()
  mimeType!: string;
}

export class MultipartPartDto {
  @IsInt()
  @Min(1)
  partNumber!: number;
}

export class MultipartCompleteDto {
  @IsString()
  uploadId!: string;

  @IsArray()
  parts!: Array<{ ETag: string; PartNumber: number }>;

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
