import { Document, Types } from "mongoose";
import { BaseFieldName, IBase, LoyaltyTransactionType } from "../../core";

export interface ILoyaltyTransaction extends Document, IBase {
  [BaseFieldName.CUSTOMER_FRANCHISE_ID]: Types.ObjectId;
  [BaseFieldName.ORDER_ID]: Types.ObjectId;
  [BaseFieldName.POINT_CHANGE]: number;
  [BaseFieldName.TYPE]: LoyaltyTransactionType;
  [BaseFieldName.REASON]: string;
  [BaseFieldName.CREATED_BY]?: Types.ObjectId;
  [BaseFieldName.CREATED_NAME]?: string;
}
