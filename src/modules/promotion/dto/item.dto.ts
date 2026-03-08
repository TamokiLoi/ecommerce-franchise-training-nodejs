import { BaseItemDto } from "../../../core/dto";

export interface PromotionItemDto extends BaseItemDto {
  franchise_id: string;
  product_franchise_id?: string;
  type: string;
  value: number;
  start_date: string;
  end_date: string;
}
