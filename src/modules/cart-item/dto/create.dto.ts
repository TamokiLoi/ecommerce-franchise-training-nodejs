import { Types } from "mongoose";

export class CreateCartItemDto {}

export interface ICreateCartItemDto {
  cart_id: Types.ObjectId;
  product_franchise_id: Types.ObjectId;
  quantity: number;
  product_cart_price: number;
  options_hash: string;
  discount_amount?: number;
  line_total?: number;
  final_line_total?: number;
}
