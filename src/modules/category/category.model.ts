import mongoose, { HydratedDocument, Schema } from "mongoose";
import { BaseModelFields } from "../../core/models";
import { CategoryFieldName } from "./category.enum";
import { ICategory } from "./category.interface";
import { COLLECTION_NAME } from "../../core/constants";
import { BaseFieldName } from "../../core/enums";

const CategorySchemaEntity = new Schema({
  [BaseFieldName.CODE]: { type: String, required: true, unique: true },
  [BaseFieldName.NAME]: { type: String, required: true },
  [BaseFieldName.DESCRIPTION]: { type: String },
  [CategoryFieldName.PARENT_ID]: { type: String },
  
  ...BaseModelFields,
});

export type CategoryDocument = HydratedDocument<ICategory>;
const CategorySchema = mongoose.model<CategoryDocument>(
  COLLECTION_NAME.CATEGORY,
  CategorySchemaEntity,
);
export default CategorySchema;
