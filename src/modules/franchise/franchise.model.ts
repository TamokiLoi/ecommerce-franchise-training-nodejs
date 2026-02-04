import mongoose, { HydratedDocument, Schema } from "mongoose";
import { COLLECTION_NAME } from "../../core/constants";
import { BaseModelFields } from "../../core/models";
import { FranchiseFieldName } from "./franchise.enum";
import { IFranchise } from "./franchise.interface";

const FranchiseSchemaEntity = new Schema({
  [FranchiseFieldName.CODE]: { type: String, unique: true, index: true },
  [FranchiseFieldName.NAME]: { type: String, required: true },
  [FranchiseFieldName.HOTLINE]: { type: String, default: "" },
  [FranchiseFieldName.LOGO_URL]: { type: String, default: "" },
  [FranchiseFieldName.ADDRESS]: { type: String, default: "" },
  [FranchiseFieldName.OPENED_AT]: { type: String, required: true },
  [FranchiseFieldName.CLOSED_AT]: { type: String, required: true },

  ...BaseModelFields,
});

export type FranchiseDocument = HydratedDocument<IFranchise>;
const FranchiseSchema = mongoose.model<FranchiseDocument>(COLLECTION_NAME.FRANCHISE, FranchiseSchemaEntity);
export default FranchiseSchema;
