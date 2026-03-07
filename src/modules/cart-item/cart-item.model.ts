import mongoose, { HydratedDocument, Schema } from "mongoose";
import { BaseFieldName, BASE_MODEL_FIELDS, COLLECTION_NAME } from "../../core";
import { ICartItem } from "./cart-item.interface";

const CartItemSchemaEntity = new Schema({
  [BaseFieldName.CART_ID]: {
    type: mongoose.Schema.Types.ObjectId,
    ref: COLLECTION_NAME.CART,
    required: true,
    index: true,
  },
  [BaseFieldName.PRODUCT_FRANCHISE_ID]: {
    type: mongoose.Schema.Types.ObjectId,
    ref: COLLECTION_NAME.PRODUCT_FRANCHISE,
    required: true,
    index: true,
  },
  [BaseFieldName.QUANTITY]: { type: Number, required: true, min: 1, default: 1 },
  [BaseFieldName.PRODUCT_CART_PRICE]: { type: Number, default: 0, required: true },
  [BaseFieldName.DISCOUNT_AMOUNT]: { type: Number, default: 0 },
  [BaseFieldName.LINE_TOTAL]: { type: Number, default: 0 },
  [BaseFieldName.FINAL_LINE_TOTAL]: { type: Number, default: 0 },
  [BaseFieldName.OPTIONS_HASH]: { type: String, default: "", required: false },

  [BaseFieldName.OPTIONS]: [
    {
      [BaseFieldName.PRODUCT_FRANCHISE_ID]: {
        type: mongoose.Schema.Types.ObjectId,
        ref: COLLECTION_NAME.PRODUCT_FRANCHISE,
        required: true,
      },
      [BaseFieldName.QUANTITY]: { type: Number, min: 1, required: true },
      [BaseFieldName.PRICE_SNAPSHOT]: { type: Number, required: true },
      [BaseFieldName.DISCOUNT_AMOUNT]: { type: Number, default: 0 },
      [BaseFieldName.FINAL_PRICE]: { type: Number, default: 0 },
    },
  ],

  ...BASE_MODEL_FIELDS,
});

CartItemSchemaEntity.index({ cart_id: 1, product_franchise_id: 1, options_hash: 1 }, { unique: true });

export type CartItemDocument = HydratedDocument<ICartItem>;
const CartItemSchema = mongoose.model<CartItemDocument>(COLLECTION_NAME.CART_ITEM, CartItemSchemaEntity);
export default CartItemSchema;
