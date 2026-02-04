import { NextFunction, Request, Response } from "express";
import { BaseRole, HttpStatus } from "../../core/enums";
import { formatResponse } from "../../core/utils";
import { RoleResponseDto } from "./dto/role.dto";

export default class IndexController {
  public index = (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(HttpStatus.Success).json("Api is running in server...");
    } catch (error) {
      next(error);
    }
  };

  public getAllRole = (req: Request, res: Response, next: NextFunction) => {
    try {
      const roles: RoleResponseDto[] = Object.entries(BaseRole).map(([key, value]) => ({
        key,
        value,
      }));

      res.status(HttpStatus.Success).json(formatResponse<RoleResponseDto[]>(roles));
    } catch (error) {
      next(error);
    }
  };
}
