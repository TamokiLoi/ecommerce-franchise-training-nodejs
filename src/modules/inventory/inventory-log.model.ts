import mongoose, { HydratedDocument, Schema } from "mongoose";
import { BaseFieldName, COLLECTION_NAME } from "../../core";
import { InventoryReferenceType, InventoryType } from "./inventory.enum";
import { IInventoryLog } from "./inventory.interface";

const InventoryLogSchemaEntity = new Schema({
  [BaseFieldName.INVENTORY_ID]: {
    type: mongoose.Schema.Types.ObjectId,
    ref: COLLECTION_NAME.INVENTORY,
    required: true,
    index: true,
  },
  [BaseFieldName.PRODUCT_FRANCHISE_ID]: {
    type: mongoose.Schema.Types.ObjectId,
    ref: COLLECTION_NAME.PRODUCT_FRANCHISE,
    required: true,
    index: true,
  },
  [BaseFieldName.CHANGE]: { type: Number, required: true },
  [BaseFieldName.TYPE]: {
    type: String,
    enum: Object.values(InventoryType),
    required: true,
    index: true,
  },
  [BaseFieldName.REFERENCE_TYPE]: {
    type: String,
    enum: Object.values(InventoryReferenceType),
    required: true,
    index: true,
  },
  [BaseFieldName.REFERENCE_ID]: { type: mongoose.Schema.Types.ObjectId, index: true },
  [BaseFieldName.REASON]: { type: String },
  [BaseFieldName.CREATED_BY]: {
    type: mongoose.Schema.Types.ObjectId,
    ref: COLLECTION_NAME.USER,
    required: true,
    index: true,
  },
  [BaseFieldName.CREATED_AT]: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

InventoryLogSchemaEntity.index({
  product_franchise_id: 1,
  created_at: -1,
});

InventoryLogSchemaEntity.index({
  reference_type: 1,
  reference_id: 1,
});

export type InventoryLogDocument = HydratedDocument<IInventoryLog>;
const InventoryLogSchema = mongoose.model<InventoryLogDocument>(
  COLLECTION_NAME.INVENTORY_LOG,
  InventoryLogSchemaEntity,
);
export default InventoryLogSchema;
