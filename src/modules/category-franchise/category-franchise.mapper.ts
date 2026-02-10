import { mapBaseResponse } from "../../core/mappers";
import { ICategoryFranchisePopulated } from "./category-franchise.interface";
import { CategoryFranchiseItemDto } from "./dto/item.dto";

export const mapItemToResponse = (item: ICategoryFranchisePopulated): CategoryFranchiseItemDto => {
  const base = mapBaseResponse(item);
  return {
    ...base,
    category_id: item.category_id._id,
    category_name: item.category_id.name,
    franchise_id: item.franchise_id._id,
    franchise_name: item.franchise_id.name,
    display_order: item.display_order,
  };
};
