import { mapBaseResponse } from "../../core";
import { ICustomerFranchise } from "./customer-franchise.interface";
import { CustomerFranchiseItemDto } from "./dto/item.dto";

export const mapItemToResponse = (item: ICustomerFranchise): CustomerFranchiseItemDto => {
  const { ...base } = mapBaseResponse(item);
  return {
    ...base,
    franchise_id: String(item.franchise_id),
    franchise_code: item.franchise_code,
    franchise_name: item.franchise_name,
    customer_id: String(item.customer_id),
    customer_name: item.customer_name,
    customer_email: item.customer_email,
    loyalty_points: item.loyalty_points,
    current_tier: item.current_tier,
    total_earned_points: item.total_earned_points,
    first_order_date: item.first_order_date?.toISOString() ?? "",
    last_order_date: item.last_order_date?.toISOString() ?? "",
  };
};
