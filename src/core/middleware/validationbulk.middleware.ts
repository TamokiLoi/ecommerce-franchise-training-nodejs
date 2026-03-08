import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { HttpStatus } from "../enums";
import { HttpException } from "../exceptions";
import { IError } from "../interfaces";

const validationBulkMiddleware = (type: any): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {

      if (!req.body || typeof req.body !== "object") {
        return next(
          new HttpException(HttpStatus.BadRequest, "Request body is required"),
        );
      }

      if (!req.body.items || !Array.isArray(req.body.items)) {
        return next(
          new HttpException(HttpStatus.BadRequest, "items must be an array"),
        );
      }

      const items = plainToInstance(type, req.body.items, {
        enableImplicitConversion: true,
      }) as object[];

      const errorResults: IError[] = [];

      for (let i = 0; i < items.length; i++) {
        const errors = await validate(items[i]);

        if (errors.length > 0) {
          errors.forEach((error) => {
            if (error.constraints) {
              Object.values(error.constraints).forEach((message) => {
                errorResults.push({
                  field: `items[${i}].${error.property}`,
                  message,
                });
              });
            }
          });
        }
      }

      if (errorResults.length > 0) {
        return next(
          new HttpException(HttpStatus.BadRequest, "", errorResults),
        );
      }

      req.body.items = items;

      next();
    } catch (error) {
      next(error);
    }
  };
};
export default validationBulkMiddleware;