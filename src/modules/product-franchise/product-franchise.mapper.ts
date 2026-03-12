import { mapBaseResponse } from "../../core/mappers";
import { ProductFranchiseItemDto, PublicProductFranchiseItemDto } from "./dto/item.dto";
import { IProductFranchise } from "./product-franchise.interface";

export const mapItemToResponse = (item: IProductFranchise): ProductFranchiseItemDto => {
  const base = mapBaseResponse(item);
  const commonFields = mapItemToPublicResponse(item);
  return {
    ...base,
    ...commonFields,
    product_id: String(item.product_id),
    product_name: item.product_name,
    franchise_id: String(item.franchise_id),
    franchise_name: item.franchise_name,
    size: item.size ?? "",
    price_base: item.price_base,
  };
};

export const mapItemToPublicResponse = (item: IProductFranchise): PublicProductFranchiseItemDto => {
  return {
    product_franchise_id: String(item._id),
    product_id: String(item.product_id),
    product_name: item.product_name,
    product_sku: item.product_sku,
    franchise_id: String(item.franchise_id),
    franchise_name: item.franchise_name,
    franchise_code: item.franchise_code,
  };
};
