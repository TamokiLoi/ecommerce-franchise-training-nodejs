import { mapBaseResponse } from "../../core/mappers/base.mapper";
import { PromotionItemDto } from "./dto/item.dto";
import { IPromotion } from "./promotion.interface";

export const mapItemToResponse = (item: IPromotion): PromotionItemDto => {
  const base = mapBaseResponse(item as any);
  return {
    ...base,
    franchise_id: String(item.franchise_id),
    franchise_name: (item as any).franchise_name ?? "",
    product_franchise_id: (item as any).product_franchise_id
      ? String((item as any).product_franchise_id)
      : "",
    type: item.type,
    value: item.value,
    start_date: item.start_date?.toISOString() ?? "",
    end_date: item.end_date?.toISOString() ?? "",
  } as PromotionItemDto;
};
