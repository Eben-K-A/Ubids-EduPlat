import { IsEnum, IsOptional, IsString } from "class-validator";

export class AiRequestDto {
  @IsString()
  prompt!: string;

  @IsOptional()
  @IsEnum(["openai", "deepseek", "huggingface"])
  provider?: "openai" | "deepseek" | "huggingface";

  @IsOptional()
  @IsString()
  model?: string;
}
