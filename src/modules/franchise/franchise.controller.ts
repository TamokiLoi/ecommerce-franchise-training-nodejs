import { NextFunction, Request, Response } from "express";
import { HttpStatus } from "../../core/enums";
import { formatPaginationResponse, formatResponse } from "../../core/utils";
import CreateFranchiseDto from "./dto/create.dto";
import { FranchiseResponseDto } from "./dto/franchise.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import { IFranchise } from "./franchise.interface";
import { mapFranchiseToResponse } from "./franchise.mapper";
import FranchiseService from "./franchise.service";
import UpdateFranchiseDto from "./dto/update.dto";
import UpdateStatusDto from "./dto/updateStatus.dto";

export default class FranchiseController {
  constructor(private readonly service: FranchiseService) {}

  public createItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const model: CreateFranchiseDto = req.body;
      const item: IFranchise = await this.service.createItem(model, req.user);
      res.status(HttpStatus.Success).json(formatResponse<FranchiseResponseDto>(mapFranchiseToResponse(item)));
    } catch (error) {
      next(error);
    }
  };

  public getItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const item: IFranchise = await this.service.getItem(id);
      res.status(HttpStatus.Success).json(formatResponse<FranchiseResponseDto>(mapFranchiseToResponse(item)));
    } catch (error) {
      next(error);
    }
  };

  public getItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const model: SearchPaginationItemDto = req.body;
      console.log(model.searchCondition.is_active);
      const result = await this.service.getItems(model);
      res
        .status(HttpStatus.Success)
        .json(formatPaginationResponse(result.pageData.map(mapFranchiseToResponse), result.pageInfo));
    } catch (error) {
      next(error);
    }
  };

  public updateItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const model: UpdateFranchiseDto = req.body;
      const item: IFranchise = await this.service.updateItem(id, model, req.user);
      res.status(HttpStatus.Success).json(formatResponse<FranchiseResponseDto>(mapFranchiseToResponse(item)));
    } catch (error) {
      next(error);
    }
  };

  public changeStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const model: UpdateStatusDto = req.body;
      await this.service.changeStatus(id, model, req.user);
      res.status(HttpStatus.Success).json(formatResponse<null>(null));
    } catch (error) {
      next(error);
    }
  };

  public softDeleteItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.service.softDeleteItem(id, req.user);
      res.status(HttpStatus.Success).json(formatResponse<null>(null));
    } catch (error) {
      next(error);
    }
  };

  public restoreItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.service.restoreItem(id, req.user);
      res.status(HttpStatus.Success).json(formatResponse<null>(null));
    } catch (error) {
      next(error);
    }
  };
}
