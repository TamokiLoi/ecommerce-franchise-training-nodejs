import mongoose, { HydratedDocument, Schema } from "mongoose";
import { BaseFieldName, BASE_MODEL_FIELDS, CartStatus, COLLECTION_NAME } from "../../core";
import { ICart } from "./cart.interface";

const CartSchemaEntity = new Schema({
  [BaseFieldName.CUSTOMER_ID]: {
    type: mongoose.Schema.Types.ObjectId,
    ref: COLLECTION_NAME.CUSTOMER,
    required: true,
  },
  [BaseFieldName.FRANCHISE_ID]: {
    type: mongoose.Schema.Types.ObjectId,
    ref: COLLECTION_NAME.FRANCHISE,
    required: true,
  },
  [BaseFieldName.STAFF_ID]: {
    type: mongoose.Schema.Types.ObjectId,
    ref: COLLECTION_NAME.USER,
    required: false,
  },
  [BaseFieldName.STATUS]: { type: String, enum: Object.values(CartStatus), default: CartStatus.ACTIVE, required: true }, // ACTIVE / CHECKED_OUT

  // --- Voucher ---
  [BaseFieldName.VOUCHER_ID]: {
    type: mongoose.Schema.Types.ObjectId,
    ref: COLLECTION_NAME.VOUCHER,
    required: false,
  },
  [BaseFieldName.VOUCHER_CODE]: { type: String, required: false },
  [BaseFieldName.ADDRESS]: { type: String, required: false },
  [BaseFieldName.PHONE]: { type: String, required: false },

  // --- Loyalty ---
  [BaseFieldName.LOYALTY_POINTS_USED]: { type: Number, default: 0 }, // tổng point đã dùng cho cart này

  // --- Pricing ---
  [BaseFieldName.PROMOTION_DISCOUNT]: { type: Number, default: 0 },
  [BaseFieldName.VOUCHER_DISCOUNT]: { type: Number, default: 0 },
  [BaseFieldName.LOYALTY_DISCOUNT]: { type: Number, default: 0 },
  [BaseFieldName.SUBTOTAL_AMOUNT]: { type: Number, default: 0 }, // tổng tiền trước khi áp các mã giảm
  [BaseFieldName.FINAL_AMOUNT]: { type: Number, default: 0 }, // tổng tiền thật phải trả

  ...BASE_MODEL_FIELDS,
});

CartSchemaEntity.index({ customer_id: 1 });

CartSchemaEntity.index(
  { customer_id: 1, franchise_id: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: CartStatus.ACTIVE } },
);

CartSchemaEntity.virtual("cart_items", {
  ref: COLLECTION_NAME.CART_ITEM,
  localField: "_id",
  foreignField: "cart_id",
});

export type CartDocument = HydratedDocument<ICart>;
const CartSchema = mongoose.model<CartDocument>(COLLECTION_NAME.CART, CartSchemaEntity);
export default CartSchema;
