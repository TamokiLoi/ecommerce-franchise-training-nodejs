import { Document, Types } from "mongoose";
import { BaseFieldName, IBase } from "../../core";
import { ICreateCartItemDto } from "./dto/create.dto";
import { ICartItemDto } from "./dto/item.dto";

export interface ICartItem extends Document, IBase {
  [BaseFieldName.CART_ID]: Types.ObjectId;
  [BaseFieldName.PRODUCT_FRANCHISE_ID]: Types.ObjectId;
  [BaseFieldName.QUANTITY]: number;
  [BaseFieldName.PRODUCT_CART_PRICE]: number; // giá hiện tại của product trong giỏ hàng
  [BaseFieldName.DISCOUNT_AMOUNT]: number; // discount theo product
  [BaseFieldName.LINE_TOTAL]: number;
  [BaseFieldName.FINAL_LINE_TOTAL]: number;
  [BaseFieldName.OPTIONS_HASH]: string;
  [BaseFieldName.OPTIONS]: ICartItemOption[];
}

export interface ICartItemOption {
  [BaseFieldName.PRODUCT_FRANCHISE_ID]: Types.ObjectId;
  [BaseFieldName.QUANTITY]: number;
  [BaseFieldName.PRICE_SNAPSHOT]: number;
  [BaseFieldName.DISCOUNT_AMOUNT]?: number;
  [BaseFieldName.FINAL_PRICE]?: number;
}

export interface ICartItemQuery {
  getById(id: string): Promise<ICartItem | null>;
  getItemsByCartId(cartId: Types.ObjectId): Promise<ICartItem[]>;
  findByIdForUpdate(id: string): Promise<ICartItem | null>;
  getCartItem(payload: ICartItemDto): Promise<ICartItem | null>;
  createCartItem(payload: ICreateCartItemDto): Promise<ICartItem>;
  findDuplicateCartItem(payload: {
    cart_id: Types.ObjectId;
    product_franchise_id: Types.ObjectId;
    options_hash: string;
    exclude_id: Types.ObjectId;
  }): Promise<ICartItem | null>;
}
