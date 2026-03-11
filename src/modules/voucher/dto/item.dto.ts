import { BaseItemDto } from "../../../core/dto";

export interface VoucherItemDto extends BaseItemDto {
  code: string;
  name: string;
  description: string;
  franchise_id: string;
  franchise_name: string;
  product_franchise_id?: string;
  product_id?: string;
  product_name?: string;
  type: string;
  value: number;
  quota_total: number;
  quota_used: number;
  start_date: string;
  end_date: string;
}
