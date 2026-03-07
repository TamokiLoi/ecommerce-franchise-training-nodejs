import { NextFunction, Request, Response } from "express";
import { BaseCrudController } from "../../core";
import { UpdateStatusDto } from "../../core/dto";
import { HttpStatus } from "../../core/enums";
import { AuthenticatedUserRequest } from "../../core/models";
import { formatResponse } from "../../core/utils";
import { ICategoryFranchise } from "./category-franchise.interface";
import { mapItemToResponse } from "./category-franchise.mapper";
import { CategoryFranchiseService } from "./category-franchise.service";
import CreateCategoryFranchiseDto from "./dto/create.dto";
import { CategoryFranchiseItemDto } from "./dto/item.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import UpdateCategoryFranchiseDto from "./dto/update.dto";
import { UpdateDisplayOrderItemDto } from "./dto/updateDisplayOrder.dto";

export class CategoryFranchiseController extends BaseCrudController<
  ICategoryFranchise,
  CreateCategoryFranchiseDto,
  UpdateCategoryFranchiseDto,
  SearchPaginationItemDto,
  CategoryFranchiseItemDto,
  CategoryFranchiseService
> {
  constructor(service: CategoryFranchiseService) {
    super(service, mapItemToResponse);
  }

  /**
   * Get categories by franchise
   */
  public getByFranchise = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { franchiseId } = req.params;
      const { onlyActive } = req.query;
      const isActive = onlyActive === undefined ? undefined : onlyActive === "true";
      const result = await this.service.getCategoriesByFranchise(franchiseId, isActive);
      res.status(HttpStatus.Success).json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Change active status
   */
  public changeStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const payload: UpdateStatusDto = req.body;
      const userId = (req as AuthenticatedUserRequest).user.id;
      await this.service.changeStatus(id, payload, userId);
      res.status(HttpStatus.Success).json(formatResponse<null>(null));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Change display order of single item
   */
  public changeDisplayOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const payload: UpdateDisplayOrderItemDto = req.body;
      const userId = (req as AuthenticatedUserRequest).user.id;
      await this.service.changeDisplayOrderItem(id, payload, userId);
      res.status(HttpStatus.Success).json(formatResponse<null>(null));
    } catch (error) {
      next(error);
    }
  };
}
