import { Request } from "express";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import CustomerSchema from "../../modules/customer/customer.model";
import UserSchema from "../../modules/user/user.model";
import { AuthPayload } from "../models";

export const verifyUserToken = async (token: string): Promise<AuthPayload> => {
  const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as AuthPayload;

  const isValidUser = await UserSchema.exists({
    _id: payload.id,
    is_deleted: false,
    is_verified: true,
    token_version: payload.version,
  });

  if (!isValidUser) {
    throw new JsonWebTokenError("Invalid token");
  }

  return payload;
};

export const verifyCustomerToken = async (token: string): Promise<AuthPayload> => {
  const payload = jwt.verify(token, process.env.JWT_CUSTOMER_ACCESS_SECRET!) as AuthPayload;

  const isValidCustomer = await CustomerSchema.exists({
    _id: payload.id,
    is_deleted: false,
    is_verified: true,
    token_version: payload.version,
  });

  if (!isValidCustomer) {
    throw new JsonWebTokenError("Invalid token");
  }

  return payload;
};

export const getTokenFromRequest = (req: Request, isCustomer = true) => {
  let token = req.cookies?.access_token;
  if (isCustomer) {
    token = req.cookies?.customer_access_token;
  }

  const authHeader = req.headers["authorization"];

  if (!token && authHeader?.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  return token;
};

export const authFormatResponse = (message: string) => {
  return { message, success: false, error: [] };
};
