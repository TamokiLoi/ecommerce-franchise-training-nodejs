import { Document, Types } from "mongoose";
import { BaseFieldName, BaseLoyaltyTier, IBase } from "../../core";

export interface ILoyaltyRule extends Document, IBase {
  [BaseFieldName.FRANCHISE_ID]: Types.ObjectId;
  [BaseFieldName.FRANCHISE_NAME]?: string;
  [BaseFieldName.EARN_AMOUNT_PER_POINT]: number;
  [BaseFieldName.REDEEM_VALUE_PER_POINT]: number;
  [BaseFieldName.MIN_REDEEM_POINTS]: number;
  [BaseFieldName.MAX_REDEEM_POINTS]: number;
  [BaseFieldName.TIER_RULES]: ITierRuleItem[];
  [BaseFieldName.DESCRIPTION]?: string;
}

export interface ITierRuleItem {
  [BaseFieldName.TIER]: BaseLoyaltyTier;
  [BaseFieldName.MIN_POINTS]: number;
  [BaseFieldName.MAX_POINTS]: number;
  [BaseFieldName.BENEFIT]: IBenefitDetail;
}

export interface IBenefitDetail {
  [BaseFieldName.ORDER_DISCOUNT_PERCENT]: number;
  [BaseFieldName.EARN_MULTIPLIER]: number;
  [BaseFieldName.FREE_SHIPPING]: boolean;
}

export interface ILoyaltyRuleQuery {
  getById(id: string): Promise<ILoyaltyRule | null>;
  getRoyaltyRuleByFranchiseId(franchiseId: string): Promise<ILoyaltyRule>;
}
