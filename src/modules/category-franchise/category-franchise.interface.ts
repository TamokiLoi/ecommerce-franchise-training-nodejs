import { Document } from "mongoose";
import { IBase } from "../../core/interfaces";
import { CategoryFranchiseFieldName } from "./category-franchise.enum";
import { BaseFieldName } from "../../core/enums";

export interface ICategoryFranchise extends Document, IBase {
  [CategoryFranchiseFieldName.CATEGORY_ID]: string;
  [CategoryFranchiseFieldName.FRANCHISE_ID]: string;
  [BaseFieldName.DISPLAY_ORDER]: number;
}

export interface ICategoryFranchisePopulated extends Omit<ICategoryFranchise, "category_id" | "franchise_id"> {
  category_id: {
    _id: string;
    name: string;
    icon?: string;
  };
  franchise_id: {
    _id: string;
    name: string;
  };
}
