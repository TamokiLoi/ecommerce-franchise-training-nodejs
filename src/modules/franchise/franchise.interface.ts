import { Document } from "mongoose";
import { IBase } from "../../core/interfaces";
import { FranchiseFieldName } from "./franchise.enum";
import CreateFranchiseDto from "./dto/create.dto";

export interface IFranchise extends Document, IBase {
  [FranchiseFieldName.CODE]: string;
  [FranchiseFieldName.NAME]: string;
  [FranchiseFieldName.HOTLINE]: string;
  [FranchiseFieldName.LOGO_URL]: string;
  [FranchiseFieldName.ADDRESS]: string;
  [FranchiseFieldName.OPENED_AT]: string;
  [FranchiseFieldName.CLOSED_AT]: string;
}

export interface IFranchiseValidation {
  validCreate(model: CreateFranchiseDto, currentUserId?: string): Promise<void>;
}
