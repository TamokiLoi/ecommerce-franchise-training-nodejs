import mongoose, { HydratedDocument, Schema } from "mongoose";
import { BASE_MODEL_FIELDS, COLLECTION_NAME } from "../../core/constants";
import { BaseFieldName } from "../../core/enums";
import { PromotionFieldName, PromotionType } from "./promotion.enum";
import { IPromotion } from "./promotion.interface";

const PromotionSchemaEntity = new Schema({
  [BaseFieldName.NAME]: { type: String, required: true, index: true },
  [BaseFieldName.FRANCHISE_ID]: {
    type: Schema.Types.ObjectId,
    ref: COLLECTION_NAME.FRANCHISE,
    required: true,
  },
  [PromotionFieldName.PRODUCT_FRANCHISE_ID]: {
    type: Schema.Types.ObjectId,
    ref: COLLECTION_NAME.PRODUCT_FRANCHISE,
    default: null,
  },
  [PromotionFieldName.TYPE]: {
    type: String,
    enum: Object.values(PromotionType),
    required: true,
  },
  [PromotionFieldName.VALUE]: { type: Number, min: 0, default: 0 },
  [PromotionFieldName.START_DATE]: { type: Date, required: true },
  [PromotionFieldName.END_DATE]: { type: Date, required: true },
  [BaseFieldName.CREATED_BY]: {
    type: Schema.Types.ObjectId,
    ref: COLLECTION_NAME.USER,
    required: true,
  },

  ...BASE_MODEL_FIELDS,
});

PromotionSchemaEntity.index({ franchise_id: 1 });

PromotionSchemaEntity.index({
  franchise_id: 1,
  start_date: 1,
  end_date: 1,
});

export type PromotionDocument = HydratedDocument<IPromotion>;
const PromotionSchema = mongoose.model<PromotionDocument>(COLLECTION_NAME.PROMOTION, PromotionSchemaEntity);
export default PromotionSchema;
