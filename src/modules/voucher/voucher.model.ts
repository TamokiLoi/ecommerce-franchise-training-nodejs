import mongoose, { HydratedDocument, Schema } from "mongoose";
import { BASE_MODEL_FIELDS, COLLECTION_NAME } from "../../core/constants";
import { BaseFieldName } from "../../core/enums";
import { VoucherFieldName, VoucherType } from "./voucher.enum";
import { IVoucher } from "./voucher.interface";

const VoucherSchemaEntity = new Schema({
  [VoucherFieldName.CODE]: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  [BaseFieldName.FRANCHISE_ID]: {
    type: Schema.Types.ObjectId,
    ref: COLLECTION_NAME.FRANCHISE,
    required: true,
  },
  [BaseFieldName.PRODUCT_FRANCHISE_ID]: {
    type: Schema.Types.ObjectId,
    ref: COLLECTION_NAME.PRODUCT_FRANCHISE,
    default: null,
  },
  [VoucherFieldName.NAME]: { type: String, required: true },
  [VoucherFieldName.DESCRIPTION]: { type: String, default: "" },
  [VoucherFieldName.TYPE]: {
    type: String,
    enum: Object.values(VoucherType),
    required: true,
  },
  [VoucherFieldName.VALUE]: { type: Number, min: 0, default: 0 },
  [VoucherFieldName.QUOTA_TOTAL]: { type: Number, min: 1, required: true },
  [VoucherFieldName.QUOTA_USED]: { type: Number, min: 0, default: 0 },
  [VoucherFieldName.START_DATE]: { type: Date, required: true },
  [VoucherFieldName.END_DATE]: { type: Date, required: true },
  [BaseFieldName.CREATED_BY]: {
    type: Schema.Types.ObjectId,
    ref: COLLECTION_NAME.USER,
    required: true,
  },

  ...BASE_MODEL_FIELDS,
});

VoucherSchemaEntity.index({ franchise_id: 1 });

VoucherSchemaEntity.index({
  franchise_id: 1,
  start_date: 1,
  end_date: 1,
});

export type VoucherDocument = HydratedDocument<IVoucher>;
const VoucherSchema = mongoose.model<VoucherDocument>(COLLECTION_NAME.VOUCHER, VoucherSchemaEntity);
export default VoucherSchema;
