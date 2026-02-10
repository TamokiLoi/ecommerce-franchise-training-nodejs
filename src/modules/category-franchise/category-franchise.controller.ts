import { NextFunction, Request, Response } from "express";
import { HttpStatus } from "../../core/enums";
import { AuthenticatedRequest } from "../../core/models";
import { formatResponse } from "../../core/utils";
import { CategoryFranchiseService } from "./category-franchise.service";
import CreateCategoryFranchiseDto from "./dto/create.dto";
import { UpdateDisplayOrderItemDto, UpdateDisplayOrderItemsDto } from "./dto/updateDisplayOrder.dto";
import UpdateStatusDto from "./dto/updateStatus.dto";

export class CategoryFranchiseController {
  constructor(private readonly service: CategoryFranchiseService) {}

  /**
   * Add category to franchise
   */
  public addCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload: CreateCategoryFranchiseDto = req.body;
      const userId = (req as AuthenticatedRequest).user.id;
      const item = await this.service.addCategoryToFranchise(payload, userId);
      res.status(HttpStatus.Created).json(formatResponse(item));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get categories by franchise
   */
  public getByFranchise = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { franchiseId } = req.params;
      const isActive = req.query.is_active === undefined ? undefined : req.query.is_active === "true";
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
      const userId = (req as AuthenticatedRequest).user.id;
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
      const payload: UpdateDisplayOrderItemDto = req.body;
      const userId = (req as AuthenticatedRequest).user.id;
      await this.service.changeDisplayOrderItem(payload, userId);
      res.status(HttpStatus.Success).json(formatResponse<null>(null));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reorder menu categories (drag & drop)
   */
  public reorder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload: UpdateDisplayOrderItemsDto = req.body;
      const userId = (req as AuthenticatedRequest).user.id;
      await this.service.reorderCategories(payload, userId);
      res.status(HttpStatus.Success).json(formatResponse<null>(null));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remove category from franchise
   */
  public remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = (req as AuthenticatedRequest).user.id;
      await this.service.softDeleteItem(id, userId);
      res.status(HttpStatus.Success).json(formatResponse<null>(null));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Restore category to franchise
   */
  public restore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = (req as AuthenticatedRequest).user.id;
      await this.service.restoreItem(id, userId);
      res.status(HttpStatus.Success).json(formatResponse<null>(null));
    } catch (error) {
      next(error);
    }
  };
}
