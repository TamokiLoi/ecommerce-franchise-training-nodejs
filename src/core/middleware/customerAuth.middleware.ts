import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import CustomerSchema from "../../modules/customer/customer.model";
import { HttpStatus } from "../enums";
import { CustomerAuthPayload } from "../models";

const formatResponse = (message: string) => {
  return { message, success: false, error: [] };
};

const customerAuthMiddleware = (): RequestHandler => {
  return async (req, res, next) => {
    let token = req.cookies?.customer_access_token;

    const authHeader = req.headers["authorization"];

    if (!token && authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      if (req.cookies?.customer_refresh_token) {
        return res.status(HttpStatus.Unauthorized).json(formatResponse("CUSTOMER_ACCESS_TOKEN_EXPIRED"));
      }

      return res
        .status(HttpStatus.Unauthorized)
        .json(formatResponse("You are not logged in. Please log in to continue!"));
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_CUSTOMER_ACCESS_SECRET!) as CustomerAuthPayload;

      const isValidCustomer = await CustomerSchema.exists({
        _id: payload.id,
        is_deleted: false,
        is_verified: true,
        token_version: payload.version,
      });

      if (!isValidCustomer) {
        return res.status(HttpStatus.Unauthorized).json(formatResponse("Invalid token"));
      }

      req.user = payload;
      next();
    } catch (err) {
      return res.status(HttpStatus.Unauthorized).json(formatResponse("Token expired or invalid"));
    }
  };
};

export default customerAuthMiddleware;
