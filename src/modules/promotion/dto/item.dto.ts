import { BaseItemDto } from "../../../core/dto";

export interface PromotionItemDto extends BaseItemDto {
  name: string;
  franchise_id: string;
  franchise_name: string;
  product_franchise_id?: string;
  product_id?: string;
  product_name?: string;
  type: string;
  value: number;
  start_date: string;
  end_date: string;
}
