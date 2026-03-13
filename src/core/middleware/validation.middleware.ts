import { plainToInstance } from "class-transformer";
import { ValidationError, validate } from "class-validator";
import { RequestHandler } from "express";
import { HttpStatus } from "../enums";
import { HttpException } from "../exceptions";
import { IError } from "../interfaces";

/**
 * Convert empty string to undefined
 * Useful for DTO optional fields
 */
const sanitizeEmptyString = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeEmptyString);
  }

  if (typeof obj === "object") {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (value === "") {
        result[key] = undefined;
      } else {
        result[key] = sanitizeEmptyString(value);
      }
    }
    return result;
  }

  return obj;
};

const validationMiddlewareOld = (
  type: any,
  skipMissingProperties = false,
  options?: { enableImplicitConversion?: boolean },
): RequestHandler => {
  return async (req, res, next) => {
    const sanitizedBody = sanitizeEmptyString(req.body);

    const dto = plainToInstance(type, sanitizedBody, {
      enableImplicitConversion: options?.enableImplicitConversion ?? true,
    });

    const errors = await validate(dto, { skipMissingProperties });

    if (errors.length > 0) {
      const errorResults: IError[] = [];

      const extractConstraints = (error: ValidationError) => {
        if (error.constraints) {
          Object.values(error.constraints).forEach((message) => {
            errorResults.push({
              message,
              field: error.property,
            });
          });
        }
        error.children?.forEach(extractConstraints);
      };

      errors.forEach(extractConstraints);
      return next(new HttpException(HttpStatus.BadRequest, "", errorResults));
    }

    req.body = dto;
    next();
  };
};

/**
 * Validation Middleware
 */
const validationMiddleware = (
  type: any,
  skipMissingProperties = false,
  options?: {
    enableImplicitConversion?: boolean;
    whitelist?: boolean;
    forbidNonWhitelisted?: boolean;
  },
): RequestHandler => {
  return async (req, res, next) => {
    try {
      /**
       * STEP 1 — sanitize empty string
       */
      const sanitizedBody = sanitizeEmptyString(req.body);

      /**
       * STEP 2 — transform to DTO
       */
      const dto = plainToInstance(type, sanitizedBody, {
        enableImplicitConversion: options?.enableImplicitConversion ?? true,
      });

      /**
       * STEP 3 — validate DTO
       */
      const errors = await validate(dto, {
        skipMissingProperties,
        whitelist: options?.whitelist ?? false,
        forbidNonWhitelisted: options?.forbidNonWhitelisted ?? false,
      });

      /**
       * STEP 4 — handle validation errors
       */
      if (errors.length > 0) {
        const errorResults: IError[] = [];

        const extractConstraints = (error: ValidationError, parentPath = "") => {
          const propertyPath = parentPath ? `${parentPath}.${error.property}` : error.property;

          /**
           * collect constraint messages
           */
          if (error.constraints) {
            Object.values(error.constraints).forEach((message) => {
              errorResults.push({
                field: propertyPath,
                message,
              });
            });
          }

          /**
           * recursive children validation
           */
          if (error.children && error.children.length > 0) {
            error.children.forEach((child) => extractConstraints(child, propertyPath));
          }
        };

        errors.forEach((error) => extractConstraints(error));

        return next(new HttpException(HttpStatus.BadRequest, "", errorResults));
      }

      /**
       * STEP 5 — replace request body with DTO
       */
      req.body = dto;

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validationMiddleware;
