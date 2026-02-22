import { BaseItemDto } from "../../../core";

export interface InventoryItemDto extends BaseItemDto {
  product_franchise_id: string;
  product_id: string;
  product_name: string;
  franchise_id: string;
  franchise_name: string;
  quantity: number;
  alert_threshold: number;
}
