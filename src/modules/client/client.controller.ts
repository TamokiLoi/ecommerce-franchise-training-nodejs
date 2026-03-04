import { NextFunction, Request, Response } from "express";
import { formatResponse, HttpStatus } from "../../core";
import { ClientService } from "./client.service";

export class ClientController {
  constructor(private readonly service: ClientService) {}

  public getFranchises = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await this.service.getFranchises();
      res.status(HttpStatus.Success).json(formatResponse(items));
    } catch (error) {
      next(error);
    }
  };

  public getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { franchiseId } = req.params;
      const items = await this.service.getCategoriesByFranchise(franchiseId);
      res.status(HttpStatus.Success).json(formatResponse(items));
    } catch (error) {
      next(error);
    }
  };

  public getMenu = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { franchiseId, categoryId } = req.query;
      const items = await this.service.getMenuByFranchise(String(franchiseId), String(categoryId));
      res.status(HttpStatus.Success).json(formatResponse(items));
    } catch (error) {
      next(error);
    }
  };

  public getProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { franchiseId, categoryId } = req.query;
      const items = await this.service.getProductsByFranchiseAndCategory(String(franchiseId), String(categoryId));
      res.status(HttpStatus.Success).json(formatResponse(items));
    } catch (error) {
      next(error);
    }
  };

  public getProductDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { franchiseId, productId } = req.params;
      const item = await this.service.getProductDetail(franchiseId, productId);
      res.status(HttpStatus.Success).json(formatResponse(item));
    } catch (error) {
      next(error);
    }
  };
}
