import { Document, Types } from "mongoose";
import { BaseFieldName } from "../../core/enums";
import { IBase } from "../../core/interfaces";
import { PromotionFieldName, PromotionType } from "./promotion.enum";

export interface IPromotion extends Document, IBase {
  [BaseFieldName.FRANCHISE_ID]: Types.ObjectId;
  [PromotionFieldName.PRODUCT_FRANCHISE_ID]?: Types.ObjectId;
  [PromotionFieldName.TYPE]: PromotionType;
  [PromotionFieldName.VALUE]: number;
  [PromotionFieldName.START_DATE]: Date;
  [PromotionFieldName.END_DATE]: Date;
  [PromotionFieldName.CREATED_BY]: Types.ObjectId;
  [BaseFieldName.IS_ACTIVE]: boolean;
  [BaseFieldName.IS_DELETED]: boolean;
}

export interface IPromotionQuery {
  getById(id: string): Promise<IPromotion | null>;
}
