import { ClientSession, Document, Types } from "mongoose";
import { BaseFieldName, BaseLoyaltyTier, CustomerAuthPayload, IBase, UserAuthPayload } from "../../core";
import { ICreateCustomerFranchiseDto } from "./dto/create.dto";

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

export interface IAddPointPayload {
  orderId: Types.ObjectId;
  customerId: Types.ObjectId;
  franchiseId: Types.ObjectId;
  final_amount: number;
  loggedUser: UserAuthPayload | CustomerAuthPayload;
}

export interface IRevertPointPayload {
  orderId: Types.ObjectId;
  customerId: Types.ObjectId;
  franchiseId: Types.ObjectId;
  final_amount: number;
  refundReason: string;
  loggedUser: UserAuthPayload | CustomerAuthPayload;
}

export interface IRestoreUsedPointsPayload {
  orderId: Types.ObjectId;
  customerId: Types.ObjectId;
  franchiseId: Types.ObjectId;
  points: number;
  refundReason?: string;
  loggedUser: UserAuthPayload | CustomerAuthPayload;
}

export interface ICustomerFranchiseQuery {
  findByCustomerAndFranchise(
    customerId: Types.ObjectId,
    franchiseId: Types.ObjectId,
    session?: ClientSession,
  ): Promise<ICustomerFranchise | null>;
  createCustomerFranchise(
    payload: ICreateCustomerFranchiseDto,
    loggedUserId: string,
    session?: ClientSession,
  ): Promise<ICustomerFranchise | null>;
  addPoints(payload: IAddPointPayload, session?: ClientSession): Promise<boolean>;
  revertPoints(payload: IRevertPointPayload, session?: ClientSession): Promise<boolean>;
  restoreUsedPoints(payload: IRestoreUsedPointsPayload, session?: ClientSession): Promise<boolean>;
  countCustomerFranchises(franchiseId?: string): Promise<number>;
}
