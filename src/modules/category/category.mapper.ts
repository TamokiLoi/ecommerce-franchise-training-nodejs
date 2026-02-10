import { mapBaseResponse } from "../../core/mappers";
import { ICategory } from "./category.interface";
import { CategoryItemDto } from "./dto/item.dto";

export const mapItemToResponse = (item: ICategory): CategoryItemDto => {
  const base = mapBaseResponse(item);
  return {
    ...base,
    code: item.code,
    name: item.name,
    description: item.description,
    parent_id: item.parent_id,
    parent_name: item.parent_name,
  };
};