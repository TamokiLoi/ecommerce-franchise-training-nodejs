import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { BaseFieldName, BaseLoyaltyTier } from "../../../core";

export default class CreateLoyaltyRuleDto {
  @IsNotEmpty()
  @IsMongoId()
  franchise_id!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  earn_amount_per_point!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  redeem_value_per_point!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_redeem_points!: number;

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

export class BenefitDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  [BaseFieldName.ORDER_DISCOUNT_PERCENT]!: number; // %

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  [BaseFieldName.EARN_MULTIPLIER]!: number;

  @IsNotEmpty()
  @IsBoolean()
  [BaseFieldName.FREE_SHIPPING]!: boolean;
}

export class TierRuleDto {
  @IsNotEmpty()
  @IsEnum(BaseLoyaltyTier)
  [BaseFieldName.TIER]!: BaseLoyaltyTier;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  [BaseFieldName.MIN_POINTS]!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  [BaseFieldName.MAX_POINTS]?: number;

  @ValidateNested()
  @Type(() => BenefitDto)
  [BaseFieldName.BENEFIT]!: BenefitDto;
}
