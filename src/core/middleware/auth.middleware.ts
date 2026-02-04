import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { DataStoredInToken } from "../../modules/auth/auth.interface";
import UserSchema from "../../modules/user/user.model";
import { BaseRole, HttpStatus } from "../enums";

export const authMiddleware = (): RequestHandler => {
  return async (req, res, next) => {
    let token = req.cookies?.access_token;
    const authHeader = req.headers["authorization"];

    if (!token && authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res
        .status(HttpStatus.Unauthorized)
        .json(formatResponse("You are not logged in. Please log in to continue!"));
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as DataStoredInToken;

      const isValidUser = await UserSchema.exists({
        _id: payload.id,
        is_deleted: false,
        is_verified: true,
        token_version: payload.version,
      });

      if (!isValidUser) {
        return res.status(HttpStatus.Unauthorized).json(formatResponse("Invalid token"));
      }

      req.user = {
        id: payload.id,
        role: payload.role,
        version: payload.version,
      };

      next();
    } catch (err) {
      return res.status(HttpStatus.Unauthorized).json(formatResponse("Token expired or invalid"));
    }
  };
};

export const optionalAuthMiddleware = (): RequestHandler => {
  return async (req, _res, next) => {
    const token = req.cookies?.access_token;

    if (!token) {
      return next();
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as DataStoredInToken;

      const user = await UserSchema.findOne({
        _id: payload.id,
        is_deleted: false,
        is_verified: true,
        token_version: payload.version,
      }).lean();

      if (user) {
        req.user = {
          id: payload.id,
          role: user.role,
          version: payload.version,
        };
      }
    } catch {
      // ignore error
    }

    next();
  };
};

export const roleGuard = (roles: BaseRole[]): RequestHandler => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HttpStatus.NotFound).json(formatResponse("You are not logged in. Please log in to continue!"));
    }

    if (!roles.includes(req.user.role)) {
      return res
        .status(HttpStatus.Forbidden)
        .json(formatResponse("Access denied. You are not allowed to perform this action."));
    }

    next();
  };
};

const formatResponse = (message: string) => {
  return { message, success: false, error: [] };
};

export default authMiddleware;
