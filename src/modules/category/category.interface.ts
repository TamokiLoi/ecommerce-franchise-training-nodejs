import { Document } from "mongoose";
import { BaseFieldName } from "../../core/enums";
import { IBase } from "../../core/interfaces";
import { CategoryFieldName } from "./category.enum";

export interface ICategory extends Document, IBase {
  [BaseFieldName.CODE]: string;
  [BaseFieldName.NAME]: string;
  [BaseFieldName.DESCRIPTION]?: string;
  [CategoryFieldName.PARENT_ID]?: string;
  [CategoryFieldName.PARENT_NAME]?: string;
}

export interface ICategoryQuery {
  getById(id: string): Promise<ICategory | null>;
}
