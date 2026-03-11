import { mapBaseResponse } from "../../core/mappers/base.mapper";
import { PromotionItemDto } from "./dto/item.dto";
import { IPromotion } from "./promotion.interface";

export const mapItemToResponse = (item: IPromotion): PromotionItemDto => {
  const base = mapBaseResponse(item);
  return {
    ...base,
    name: item.name,
    franchise_id: String(item.franchise_id),
    franchise_name: item.franchise_name ?? "",
    product_franchise_id: item.product_franchise_id ? String(item.product_franchise_id) : "",
    product_id: item.product_id ?? "",
    product_name: item.product_name ?? "",
    type: item.type,
    value: item.value,
    start_date: item.start_date?.toISOString() ?? "",
    end_date: item.end_date?.toISOString() ?? "",
  };
};
