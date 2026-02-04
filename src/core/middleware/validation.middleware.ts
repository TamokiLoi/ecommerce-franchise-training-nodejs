import { plainToInstance } from "class-transformer";
import { ValidationError, validate } from "class-validator";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { HttpStatus } from "../enums";
import { HttpException } from "../exceptions";
import { IError } from "../interfaces";

// const validationMiddleware = (type: any, skipMissingProperties = false): RequestHandler => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     validate(plainToInstance(type, req.body, { enableImplicitConversion: true }), { skipMissingProperties }).then(
//       (errors: ValidationError[]) => {
//         if (errors.length > 0) {
//           let errorResults: IError[] = [];

//           const extractConstraints = (error: ValidationError) => {
//             if (error.constraints) {
//               Object.values(error.constraints || {}).forEach((message) => {
//                 errorResults.push({
//                   message,
//                   field: error.property,
//                 });
//               });
//             }
//             if (error.children && error.children.length > 0) {
//               error.children.forEach((childError) => {
//                 extractConstraints(childError);
//               });
//             }
//           };

//           errors.forEach((error) => {
//             extractConstraints(error);
//           });

//           next(new HttpException(HttpStatus.BadRequest, "", errorResults));
//         } else {
//           next();
//         }
//       },
//     );
//   };
// };

const validationMiddleware = (
  type: any,
  skipMissingProperties = false,
  options?: { enableImplicitConversion?: boolean },
): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dto = plainToInstance(type, req.body, {
      enableImplicitConversion: options?.enableImplicitConversion ?? true,
    });

    const errors = await validate(dto, { skipMissingProperties });

    if (errors.length > 0) {
      let errorResults: IError[] = [];

      const extractConstraints = (error: ValidationError) => {
        if (error.constraints) {
          Object.values(error.constraints).forEach((message) => {
            errorResults.push({
              message,
              field: error.property,
            });
          });
        }
        if (error.children?.length) {
          error.children.forEach(extractConstraints);
        }
      };

      errors.forEach(extractConstraints);

      return next(new HttpException(HttpStatus.BadRequest, "", errorResults));
    }

    req.body = dto;
    next();
  };
};

export default validationMiddleware;
