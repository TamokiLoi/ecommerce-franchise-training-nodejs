import { mapBaseResponse } from "../../core";
import { InventoryItemDto } from "./dto/item.dto";
import { IInventory } from "./inventory.interface";

export const mapItemToResponse = (item: IInventory): InventoryItemDto => {
  const base = mapBaseResponse(item);
  return {
    ...base,
    product_franchise_id: String(item.product_franchise_id),
    product_id: String(item.product_id),
    product_name: item.product_name,
    franchise_id: String(item.franchise_id),
    franchise_name: item.franchise_name,
    quantity: item.quantity,
    alert_threshold: item.alert_threshold,
  };
};