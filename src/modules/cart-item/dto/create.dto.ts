import { Types } from "mongoose";

export class CreateCartItemDto {}

export interface ICreateCartItemDto {
  cart_id: Types.ObjectId;
  product_franchise_id: Types.ObjectId;
  quantity: number;
  product_cart_price: number;
  
  options_hash: string;
  options?: ICartItemOptionDto[];

  discount_amount?: number;
  line_total?: number;
  final_line_total?: number;
}

export interface ICartItemOptionDto {
  product_franchise_id: Types.ObjectId;
  quantity: number;
  price_snapshot: number;
  discount_amount?: number;
  final_price?: number;
}
