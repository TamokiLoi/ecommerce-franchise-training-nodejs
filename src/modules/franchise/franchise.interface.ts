import { Document, Types } from "mongoose";
import { BaseFieldName } from "../../core/enums";
import { IBase } from "../../core/interfaces";
import CreateFranchiseDto from "./dto/create.dto";
import { FranchiseFieldName } from "./franchise.enum";

export interface IFranchise extends Document, IBase {
  [BaseFieldName.CODE]: string;
  [BaseFieldName.NAME]: string;
  [FranchiseFieldName.HOTLINE]: string;
  [FranchiseFieldName.LOGO_URL]: string;
  [FranchiseFieldName.ADDRESS]: string;
  [FranchiseFieldName.OPENED_AT]: string;
  [FranchiseFieldName.CLOSED_AT]: string;
}

export interface IFranchiseQueryResult {
  id: Types.ObjectId | string;
  code: string;
  name: string;
}

export interface IFranchiseValidation {
  validCreate(model: CreateFranchiseDto, currentUserId?: string): Promise<void>;
}

export interface IFranchiseQuery {
  getByIds(ids: string[]): Promise<IFranchiseQueryResult[]>;
  getById(id: string): Promise<IFranchise | null>;
}
