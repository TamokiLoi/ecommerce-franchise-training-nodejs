import { mapBaseResponse } from "../../core/mappers/base.mapper";
import { VoucherItemDto } from "./dto/item.dto";
import { IVoucher } from "./voucher.interface";

export const mapItemToResponse = (item: IVoucher): VoucherItemDto => {
  const base = mapBaseResponse(item);
  return {
    ...base,
    code: item.code,
    name: item.name,
    description: item.description,
    franchise_id: String(item.franchise_id),
    franchise_name: item.franchise_name ?? "",
    product_franchise_id: item.product_franchise_id ? String(item.product_franchise_id) : "",
    product_id: item.product_id ?? "",
    product_name: item.product_name ?? "",
    type: item.type,
    value: item.value,
    quota_total: item.quota_total,
    quota_used: item.quota_used,
    start_date: item.start_date?.toISOString() ?? "",
    end_date: item.end_date?.toISOString() ?? "",
  };
};
