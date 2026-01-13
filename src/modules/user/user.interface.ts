import { ClientSession, Document, Types } from "mongoose";
import { BaseRole } from "../../core/enums";
import { IBase } from "../../core/interfaces";
import { UserFieldName } from "./user.enum";

export interface IUser extends Document, IBase {
  [UserFieldName.ID]: Types.ObjectId;
  [UserFieldName.EMAIL]: string;
  [UserFieldName.PASSWORD]?: string;
  [UserFieldName.USER_NAME]: string;
  [UserFieldName.ROLE]: BaseRole;

  // check verify
  [UserFieldName.IS_VERIFIED]?: boolean; // default false,
  [UserFieldName.VERIFICATION_TOKEN]?: string; // default empty
  [UserFieldName.VERIFICATION_TOKEN_EXPIRES]?: Date; // default new Date()

  // check login/logout
  [UserFieldName.TOKEN_VERSION]: number; // default 0

  [UserFieldName.IS_BLOCKED]: boolean; // default false
}

export interface IUserValidation {
  validCreateUser(email: string): Promise<void>;
  validUserToken(token: string): Promise<void>;
  validUserLogin(user: IUser, password: string): Promise<void>;
}

export interface IUserQuery {
  createUser(model: Partial<IUser>, session?: ClientSession): Promise<IUser>;
  verifyUserByToken(token: string): Promise<void>;
  getUserByToken(token: string): Promise<IUser>;
  getUserByEmail(email: string): Promise<IUser>;
  getUserById(id: string): Promise<IUser>;
}
