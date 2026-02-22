import { Document, Types } from "mongoose";
import { IBase } from "../../core";
import { BaseFieldName } from "../../core/enums";
import { InventoryReferenceType, InventoryType } from "./inventory.enum";

export interface IInventory extends Document, IBase {
  [BaseFieldName.PRODUCT_FRANCHISE_ID]: Types.ObjectId;
  [BaseFieldName.PRODUCT_ID]: Types.ObjectId;
  product_name: string;
  [BaseFieldName.FRANCHISE_ID]: Types.ObjectId;
  franchise_name: string;
  [BaseFieldName.QUANTITY]: number;
  [BaseFieldName.ALERT_THRESHOLD]: number;
}

export interface IInventoryLog extends Document {
  [BaseFieldName.INVENTORY_ID]: Types.ObjectId;
  [BaseFieldName.PRODUCT_FRANCHISE_ID]: Types.ObjectId;
  [BaseFieldName.CHANGE]: number;
  [BaseFieldName.TYPE]: InventoryType;
  [BaseFieldName.REFERENCE_TYPE]: InventoryReferenceType;
  [BaseFieldName.REFERENCE_ID]?: Types.ObjectId;
  [BaseFieldName.REASON]?: string;
  [BaseFieldName.CREATED_BY]: Types.ObjectId;
  [BaseFieldName.CREATED_AT]: Date;
}

export interface IInventoryQuery {
  getById(id: string): Promise<IInventory | null>;
  getByProductFranchiseId(productFranchiseId: string): Promise<IInventory | null>;
}
