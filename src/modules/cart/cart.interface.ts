import { Document, Types } from "mongoose";
import { BaseFieldName, IBase } from "../../core";

export interface ICart extends Document, IBase {
  [BaseFieldName.FRANCHISE_ID]: Types.ObjectId;
  [BaseFieldName.FRANCHISE_NAME]?: string;
  [BaseFieldName.CUSTOMER_ID]: Types.ObjectId;
  [BaseFieldName.CUSTOMER_NAME]?: string;
  [BaseFieldName.CUSTOMER_EMAIL]?: string;
  [BaseFieldName.CUSTOMER_PHONE]?: string;
  [BaseFieldName.ADDRESS]?: string;
  [BaseFieldName.PHONE]?: string;
  [BaseFieldName.STAFF_ID]?: Types.ObjectId;
  [BaseFieldName.STAFF_NAME]?: string;
  [BaseFieldName.STATUS]: string;
  [BaseFieldName.VOUCHER_ID]?: Types.ObjectId;
  [BaseFieldName.VOUCHER_CODE]?: string;
  [BaseFieldName.LOYALTY_POINTS_USED]?: number;
  [BaseFieldName.PROMOTION_DISCOUNT]: number;
  [BaseFieldName.VOUCHER_DISCOUNT]: number;
  [BaseFieldName.LOYALTY_DISCOUNT]: number;
  [BaseFieldName.SUBTOTAL_AMOUNT]: number;
  [BaseFieldName.FINAL_AMOUNT]: number;
}
