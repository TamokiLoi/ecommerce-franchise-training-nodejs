import { BaseItemDto } from "../../../core";

export interface CartItemDto extends BaseItemDto {
  franchise_id: string;
  customer_id: string;
  staff_id?: string;
  staff_name?: string;
  status: string;
  address?: string;
  phone?: string;
  voucher_id?: string;
  voucher_code?: string;
  loyalty_points_used?: number;
  promotion_discount: number;
  voucher_discount: number;
  loyalty_discount: number;
  subtotal_amount: number;
  final_amount: number;
}
