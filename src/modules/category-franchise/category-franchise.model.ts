import mongoose, { HydratedDocument, Schema } from "mongoose";
import { COLLECTION_NAME } from "../../core/constants";
import { BaseFieldName } from "../../core/enums";
import { BaseModelFields } from "../../core/models";
import { ICategoryFranchise } from "./category-franchise.interface";

const CategoryFranchiseSchemaEntity = new Schema({
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: COLLECTION_NAME.CATEGORY,
    required: true,
  },
  franchise_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: COLLECTION_NAME.FRANCHISE,
    required: true,
  },
  [BaseFieldName.DISPLAY_ORDER]: { type: Number, default: 1 },

  ...BaseModelFields,
});

CategoryFranchiseSchemaEntity.index(
  {
    category_id: 1,
    franchise_id: 1,
  },
  { unique: true },
);

export type CategoryFranchiseDocument = HydratedDocument<ICategoryFranchise>;
const CategoryFranchiseSchema = mongoose.model<CategoryFranchiseDocument>(
  COLLECTION_NAME.CATEGORY_FRANCHISE,
  CategoryFranchiseSchemaEntity,
);
export default CategoryFranchiseSchema;
