import { mapBaseResponse } from "../../core";
import { LoyaltyRuleItemDto } from "./dto/item.dto";
import { ILoyaltyRule } from "./loyalty-rule.interface";

export const mapItemToResponse = (item: ILoyaltyRule): LoyaltyRuleItemDto => {
  const base = mapBaseResponse(item);

  return {
    ...base,

    franchise_id: String(item.franchise_id),
    franchise_name: item.franchise_name ?? "",

    earn_amount_per_point: item.earn_amount_per_point,

    redeem_value_per_point: item.redeem_value_per_point,
    min_redeem_points: item.min_redeem_points,
    max_redeem_points: item.max_redeem_points,

    tier_rules: (item.tier_rules ?? []).map((tier) => ({
      tier: tier.tier,
      min_points: tier.min_points,
      max_points: tier.max_points,

      benefit: {
        order_discount_percent: tier.benefit.order_discount_percent,
        earn_multiplier: tier.benefit.earn_multiplier,
        free_shipping: tier.benefit.free_shipping,
      },
    })),

    description: item.description ?? "",
  };
};
