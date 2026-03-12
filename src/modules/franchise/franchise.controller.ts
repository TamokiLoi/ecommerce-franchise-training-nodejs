import { NextFunction, Request, Response } from "express";
import {
  AuthenticatedUserRequest,
  BaseCrudController,
  BaseItemSelectDto,
  formatResponse,
  HttpStatus,
  mapItemToSelect,
  UpdateStatusDto,
} from "../../core";
import CreateFranchiseDto from "./dto/create.dto";
import { FranchiseItemDto } from "./dto/item.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import UpdateFranchiseDto from "./dto/update.dto";
import { IFranchise } from "./franchise.interface";
import { mapItemToResponse } from "./franchise.mapper";
import FranchiseService from "./franchise.service";

export default class FranchiseController extends BaseCrudController<
  IFranchise,
  CreateFranchiseDto,
  UpdateFranchiseDto,
  SearchPaginationItemDto,
  FranchiseItemDto,
  FranchiseService
> {
  constructor(service: FranchiseService) {
    super(service, mapItemToResponse);
  }

  public changeStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const payload: UpdateStatusDto = req.body;
      await this.service.changeStatus(id, payload, (req as AuthenticatedUserRequest).user.id);
      res.status(HttpStatus.Success).json(formatResponse<null>(null));
    } catch (error) {
      next(error);
    }
  };

  public getAllFranchises = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await this.service.getAllFranchises();
      const selectItems = items.map((item) =>
        mapItemToSelect({
          ...item,
          image: item.logo_url,
        }),
      );
      res.status(HttpStatus.Success).json(formatResponse<BaseItemSelectDto[]>(selectItems));
    } catch (error) {
      next(error);
    }
  };
}
