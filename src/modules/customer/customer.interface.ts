import { ClientSession, Document } from "mongoose";
import { BaseFieldName, IBase } from "../../core";

export interface ICustomer extends Document, IBase {
  [BaseFieldName.EMAIL]: string;
  [BaseFieldName.PASSWORD]?: string;
  [BaseFieldName.NAME]: string;
  [BaseFieldName.PHONE]: string;
  [BaseFieldName.AVATAR_URL]: string;
  [BaseFieldName.ADDRESS]: string;

  // check verify
  [BaseFieldName.IS_VERIFIED]?: boolean; // default false,
  [BaseFieldName.VERIFICATION_TOKEN]?: string | null; // default empty
  [BaseFieldName.VERIFICATION_TOKEN_EXPIRES]?: Date | null; // default new Date()

  // check login/logout
  [BaseFieldName.TOKEN_VERSION]: number; // default 0

  // check reset password time
  [BaseFieldName.LAST_RESET_PASSWORD_AT]?: Date;
}

export interface ICustomerQuery {
  getById(id: string, isPassword?: boolean): Promise<ICustomer | null>;
  getByEmail(email: string): Promise<ICustomer | null>;
  getByToken(token: string): Promise<ICustomer | null>;
  updateCustomerTokenVersion(id: string): Promise<ICustomer | null>;
  updateCustomerResendToken(id: string): Promise<ICustomer | null>;
  updateCustomerPassword(id: string, newPassword: string, isForgotPassword?: boolean): Promise<ICustomer | null>;
  increaseTokenVersion(id: string): Promise<ICustomer | null>;
  countCustomers(session?: ClientSession): Promise<number>;
}
