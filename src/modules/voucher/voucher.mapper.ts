import { mapBaseResponse } from "../../core/mappers/base.mapper";
import { VoucherItemDto } from "./dto/item.dto";
import { IVoucher } from "./voucher.interface";

export const mapItemToResponse = (item: IVoucher): VoucherItemDto => {
  const base = mapBaseResponse(item as any);
  return {
    ...base,
    code: item.code,
    franchise_id: String(item.franchise_id),
    product_franchise_id: (item as any).product_franchise_id
      ? String((item as any).product_franchise_id)
      : undefined,
    name: item.name,
    description: item.description,
    type: item.type,
    value: item.value,
    quota_total: item.quota_total,
    quota_used: item.quota_used,
    start_date: item.start_date?.toISOString() ?? "",
    end_date: item.end_date?.toISOString() ?? "",
  } as VoucherItemDto;
};
