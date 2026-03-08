import { BaseItemDto } from "../../../core/dto";

export interface VoucherItemDto extends BaseItemDto {
  code: string;
  franchise_id: string;
  product_franchise_id?: string;
  name: string;
  description: string;
  type: string;
  value: number;
  quota_total: number;
  quota_used: number;
  start_date: string;
  end_date: string;
}
