import { BaseLoyaltyTier } from "../../../core";

export interface CustomerFranchiseItemDto {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  franchise_id: string;
  franchise_name: string;
  franchise_code: string;
  loyalty_points: number;
  current_tier: BaseLoyaltyTier;
  total_earned_points: number;
  first_order_date: string;
  last_order_date: string;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}
