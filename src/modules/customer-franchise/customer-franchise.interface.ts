import { Document, Types } from "mongoose";
import { BaseFieldName, BaseLoyaltyTier, IBase } from "../../core";
import CreateCustomerFranchiseDto from "./dto/create.dto";

export interface ICustomerFranchise extends Document, IBase {
  [BaseFieldName.CUSTOMER_ID]: Types.ObjectId;
  [BaseFieldName.FRANCHISE_ID]: Types.ObjectId;
  [BaseFieldName.LOYALTY_POINTS]: number; // default 0
  [BaseFieldName.CURRENT_TIER]: BaseLoyaltyTier; // BRONZE, SILVER, GOLD, PLATINUM
  [BaseFieldName.TOTAL_EARNED_POINTS]: number; // default 0
  [BaseFieldName.FIRST_ORDER_DATE]?: Date;
  [BaseFieldName.LAST_ORDER_DATE]?: Date;
  [BaseFieldName.TOTAL_ORDERS]: number; // default 0
  [BaseFieldName.TOTAL_SPENT]: number; // default 0

  customer_name: string;
  customer_email: string;
  customer_phone: string;
  franchise_code: string;
  franchise_name: string;
}

export interface ICustomerFranchiseQuery {
  createItem(payload: CreateCustomerFranchiseDto, loggedUserId: string): Promise<ICustomerFranchise | null>;
}
