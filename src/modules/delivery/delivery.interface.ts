import { ClientSession, Document, Types } from "mongoose";
import { BaseFieldName, DeliveryStatus, IBase } from "../../core";

export interface IDelivery extends Document, IBase {
  [BaseFieldName.ORDER_ID]: Types.ObjectId;
  [BaseFieldName.ORDER_CODE]?: string;
  [BaseFieldName.CUSTOMER_ID]: Types.ObjectId;
  [BaseFieldName.CUSTOMER_NAME]?: string;
  [BaseFieldName.CUSTOMER_EMAIL]?: string;
  [BaseFieldName.CUSTOMER_PHONE]?: string;
  [BaseFieldName.STATUS]: DeliveryStatus;

  [BaseFieldName.ASSIGNED_TO]: Types.ObjectId;
  [BaseFieldName.ASSIGNED_BY]: Types.ObjectId;
  [BaseFieldName.ASSIGNED_AT]: Date;
  [BaseFieldName.PICKED_UP_AT]: Date;
  [BaseFieldName.DELIVERED_AT]: Date;
  [BaseFieldName.FAILED_REASON]?: string;
}

export interface IAddDeliveryPayload {
  [BaseFieldName.ORDER_ID]: Types.ObjectId;
  [BaseFieldName.CUSTOMER_ID]: Types.ObjectId;
  [BaseFieldName.ASSIGNED_TO]: Types.ObjectId;
  [BaseFieldName.ASSIGNED_BY]: Types.ObjectId;
  [BaseFieldName.STATUS]: DeliveryStatus;
  [BaseFieldName.ASSIGNED_AT]: Date;
}

export interface IDeliveryQuery {
  getById(id: string): Promise<IDelivery | null>;
  createDelivery(payload: IAddDeliveryPayload, session?: ClientSession): Promise<IDelivery>;
}
