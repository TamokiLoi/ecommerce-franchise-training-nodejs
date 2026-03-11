import { RequestHandler } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { BaseRole, HttpStatus, RoleScope } from "../enums";
import { authFormatResponse, getTokenFromRequest, verifyUserToken } from "./auth.helper";

export interface AuthContext {
  scope: RoleScope;
  roles: BaseRole[];
}

// Middleware to ensure that a user context is selected
export const requireContext: RequestHandler = (req, res, next) => {
  if (!req.user?.context) {
    return res.status(HttpStatus.Forbidden).json(authFormatResponse("Please select a context first"));
  }
  next();
};

// Middleware to check if the user has one of the required roles
export const requireRole = (roles: BaseRole[]): RequestHandler => {
  return (req, res, next) => {
    const context = req.user?.context;

    if (!context) {
      return res.status(HttpStatus.Forbidden).json(authFormatResponse("Context not selected"));
    }

    if (!roles.includes(context.role)) {
      return res
        .status(HttpStatus.Forbidden)
        .json(authFormatResponse("Access denied. You are not allowed to perform this action."));
    }

    next();
  };
};

// Middleware to check if the user has the required scope
export const requireScope = (scope: RoleScope): RequestHandler => {
  return (req, res, next) => {
    const context = req.user?.context;

    if (!context || context.scope !== scope) {
      return res
        .status(HttpStatus.Forbidden)
        .json(authFormatResponse("Access denied. You are not allowed to perform this action."));
    }

    next();
  };
};

// Middleware to check if the user has one of the required roles within the specified scope
export const requireRoleAndScope = (rules: AuthContext[]): RequestHandler => {
  return (req, res, next) => {
    const context = req.user?.context;
    if (!context) {
      return res.status(HttpStatus.Forbidden).json(authFormatResponse("Context not selected"));
    }

    const matched = rules.some((r) => r.scope === context.scope && r.roles.includes(context.role));

    if (!matched) {
      return res
        .status(HttpStatus.Forbidden)
        .json(authFormatResponse("Access denied. You are not allowed to perform this action."));
    }

    next();
  };
};

// Convenience middleware for requiring global roles
export const requireGlobalRole = () => [
  requireContext,
  requireScope(RoleScope.GLOBAL),
  requireRole([BaseRole.SUPER_ADMIN, BaseRole.ADMIN]),
];

// Convenience middleware for requiring more complex context rules
export const requireMoreContext = (rules: AuthContext[]) => [requireContext, requireRoleAndScope(rules)];

const adminAuthMiddleware = (): RequestHandler => {
  return async (req, res, next) => {
    const token = getTokenFromRequest(req, false);

    // ❗ Không có access token
    if (!token) {
      // Có refresh token -> access token hết hạn
      if (req.cookies?.refresh_token) {
        return res.status(HttpStatus.Unauthorized).json(authFormatResponse("ACCESS_TOKEN_EXPIRED"));
      }

      // Không có gì -> chưa login
      return res
        .status(HttpStatus.Unauthorized)
        .json(authFormatResponse("You are not logged in. Please log in to continue!"));
    }

    try {
      const payload = await verifyUserToken(token);
      req.user = payload;
      next();
    } catch (err) {
      // 2️⃣ Token hết hạn
      if (err instanceof TokenExpiredError) {
        return res.status(HttpStatus.Unauthorized).json(authFormatResponse("Access token has expired"));
      }

      // 3️⃣ Token sai / bị sửa
      if (err instanceof JsonWebTokenError) {
        return res.status(HttpStatus.Unauthorized).json(authFormatResponse("Invalid token"));
      }

      // fallback
      return res.status(HttpStatus.Unauthorized).json(authFormatResponse("Token expired or invalid"));
    }
  };
};

export default adminAuthMiddleware;
