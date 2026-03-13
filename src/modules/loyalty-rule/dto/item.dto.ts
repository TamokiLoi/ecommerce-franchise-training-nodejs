import { BaseItemDto, BaseLoyaltyTier } from "../../../core";

export interface LoyaltyRuleItemDto extends BaseItemDto {
  franchise_id: string;
  franchise_name?: string;
  earn_amount_per_point: number;
  redeem_value_per_point: number;
  min_redeem_points: number;
  max_redeem_points?: number;
  tier_rules: TierRuleItemDto[];
  description?: string;
}

export interface TierRuleItemDto {
  tier: BaseLoyaltyTier;
  min_points: number;
  max_points?: number;
  benefit: BenefitDetailDto;
}

export interface BenefitDetailDto {
  order_discount_percent: number;
  earn_multiplier: number;
  free_shipping: boolean;
}
