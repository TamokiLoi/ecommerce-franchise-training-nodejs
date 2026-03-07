import { Document, Types } from "mongoose";
import { BaseFieldName } from "../../core/enums";
import { IBase } from "../../core/interfaces";
import { IUserContext } from "../../core/models";

export interface IUserFranchiseRole extends Document, IBase {
  [BaseFieldName.FRANCHISE_ID]: Types.ObjectId;
  franchise_code: string;
  franchise_name: string;
  [BaseFieldName.ROLE_ID]: Types.ObjectId;
  role_code: string;
  role_name: string;
  [BaseFieldName.USER_ID]: Types.ObjectId;
  user_name: string;
  user_email: string;
  [BaseFieldName.NOTE]?: string;
}

export interface IUserFranchiseRoleQuery {
  getUserContexts(userId: string): Promise<IUserContext[]>;
  //TODO CHECK EXIST BY FRANCHISE AND USER
  checkExistByFranchiseAndUser(franchiseId: string, userId: string): Promise<boolean>;
}
