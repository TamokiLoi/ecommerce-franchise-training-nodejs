import { mapBaseResponse } from "../../core";
import { ICart } from "./cart.interface";
import { CartItemDto } from "./dto/item.dto";

export const mapItemToResponse = (item: ICart): CartItemDto => {
  const { ...base } = mapBaseResponse(item);

  return {
    ...base,
    franchise_id: String(item.franchise_id),
    customer_id: String(item.customer_id),
    staff_id: String(item.staff_id),
    staff_name: item.staff_name,
    status: item.status,
    address: item.address,
    phone: item.phone,
    voucher_id: String(item.voucher_id),
    voucher_code: item.voucher_code,
    loyalty_points_used: item.loyalty_points_used,
    promotion_discount: item.promotion_discount,
    voucher_discount: item.voucher_discount,
    loyalty_discount: item.loyalty_discount,
    subtotal_amount: item.subtotal_amount,
    final_amount: item.final_amount,
  };
};
