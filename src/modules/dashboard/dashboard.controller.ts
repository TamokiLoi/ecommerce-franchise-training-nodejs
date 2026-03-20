import { formatResponse, HttpStatus } from "../../core";
import { DashboardService } from "./dashboard.service";
import { NextFunction, Request, Response } from "express";

export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  public getDashboardInfo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { franchiseId } = req.query;
      const items = await this.service.getDashboardInfo(String(franchiseId || ""));
      res.status(HttpStatus.Success).json(formatResponse(items));
    } catch (error) {
      next(error);
    }
  };
}
