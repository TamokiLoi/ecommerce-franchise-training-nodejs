import { AuthenticatedUserRequest, BaseCrudController, formatResponse, HttpStatus, UpdateStatusDto } from "../../core";
import { NextFunction, Request, Response } from "express";
import { CreateProductCategoryFranchiseDto } from "./dto/create.dto";
import { ProductCategoryFranchiseItemDto } from "./dto/item.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import { UpdateProductCategoryFranchiseDto } from "./dto/update.dto";
import { UpdateDisplayOrderItemDto } from "./dto/updateDisplayOrder.dto";
import { IProductCategoryFranchise } from "./product-category-franchise.interface";
import { mapItemToResponse } from "./product-category-franchise.mapper";
import { ProductCategoryFranchiseService } from "./product-category-franchise.service";

export default class ProductCategoryFranchiseController extends BaseCrudController<
  IProductCategoryFranchise,
  CreateProductCategoryFranchiseDto,
  UpdateProductCategoryFranchiseDto,
  SearchPaginationItemDto,
  ProductCategoryFranchiseItemDto,
  ProductCategoryFranchiseService
> {
  constructor(service: ProductCategoryFranchiseService) {
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

  /**
   * Reorder menu categories (drag & drop)
   */
  public reorder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload: UpdateDisplayOrderItemDto = req.body;
      const userId = (req as AuthenticatedUserRequest).user.id;
      await this.service.reorderCategoriesInFranchise(payload, userId);
      res.status(HttpStatus.Success).json(formatResponse<null>(null));
    } catch (error) {
      next(error);
    }
  };

  public getProductsWithCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { franchiseId } = req.params;
      const items = await this.service.getProductsWithCategoriesByFranchise(franchiseId);
      res.status(HttpStatus.Success).json(formatResponse<any[]>(items));
    } catch (error) {
      next(error);
    }
  };
}
