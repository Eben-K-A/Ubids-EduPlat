import { IsBoolean, IsInt, Max, Min } from "class-validator";

export class GradePolicyDto {
  @IsInt()
  @Min(0)
  @Max(100)
  latePenaltyPercent!: number;

  @IsBoolean()
  allowResubmission!: boolean;

  @IsInt()
  @Min(1)
  @Max(10)
  maxAttempts!: number;
}
