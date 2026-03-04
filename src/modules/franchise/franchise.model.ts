import mongoose, { HydratedDocument, Schema } from "mongoose";
import { FranchiseFieldName } from "./franchise.enum";
import { IFranchise } from "./franchise.interface";
import { BASE_MODEL_FIELDS, BaseFieldName, COLLECTION_NAME } from "../../core";

const FranchiseSchemaEntity = new Schema({
  [BaseFieldName.CODE]: { type: String, unique: true, index: true },
  [BaseFieldName.NAME]: { type: String, required: true },
  [FranchiseFieldName.HOTLINE]: { type: String, default: "" },
  [FranchiseFieldName.LOGO_URL]: { type: String, default: "" },
  [FranchiseFieldName.ADDRESS]: { type: String, default: "" },
  [FranchiseFieldName.OPENED_AT]: { type: String, required: true },
  [FranchiseFieldName.CLOSED_AT]: { type: String, required: true },
  [FranchiseFieldName.GOOGLE_MAP_SCRIPT]: { type: String, default: "" },

  ...BASE_MODEL_FIELDS,
});

export type FranchiseDocument = HydratedDocument<IFranchise>;
const FranchiseSchema = mongoose.model<FranchiseDocument>(COLLECTION_NAME.FRANCHISE, FranchiseSchemaEntity);
export default FranchiseSchema;
