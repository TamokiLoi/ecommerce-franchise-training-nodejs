import { Type } from "class-transformer";
import { IsArray, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import { TierRuleDto } from "./create.dto";

export class UpdateLoyaltyRuleDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  earn_amount_per_point?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  redeem_value_per_point?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_redeem_points?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  max_redeem_points?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TierRuleDto)
  tier_rules?: TierRuleDto[];

  @IsOptional()
  @IsString()
  description?: string;
}
