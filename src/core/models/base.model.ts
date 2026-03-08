import { Request } from "express";
import { RoleScope } from "../enums";

export enum UserType {
  USER = "user",
  CUSTOMER = "customer",
}

export const BaseModelNoActive = {
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  is_deleted: { type: Boolean, default: false },
}

export interface AuthenticatedUserRequest extends Request {
  user: {
    id: string;
    context: IUserContext | null;
    version: number;
    type: UserType.USER;
  };
}

export interface AuthenticatedCustomerRequest extends Request {
  user: {
    id: string;
    context: null; // Customers don't have a context
    version: number;
    type: UserType.CUSTOMER;
  };
}

export interface UserAuthPayload {
  id: string;
  context: IUserContext | null;
  version: number;
  type: UserType;
}

export interface CustomerAuthPayload {
  id: string;
  context: null; // Customers don't have a context
  version: number;
  type: UserType.CUSTOMER;
}

export interface IUserContext {
  role: string; // role.code
  scope: RoleScope; // GLOBAL | FRANCHISE
  franchise_id: string | null; // null if GLOBAL
}
