import { NextFunction, Request, Response } from "express";
import { formatResponse, HttpStatus } from "../../core";
import { BaseCrudController } from "../../core/controller";
import { CreatePromotionDto } from "./dto/create.dto";
import { PromotionItemDto } from "./dto/item.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import { UpdatePromotionDto } from "./dto/update.dto";
import { IPromotion } from "./promotion.interface";
import { mapItemToResponse } from "./promotion.mapper";
import { PromotionService } from "./promotion.service";

export class PromotionController extends BaseCrudController<
  IPromotion,
  CreatePromotionDto,
  UpdatePromotionDto,
  SearchPaginationItemDto,
  PromotionItemDto,
  PromotionService
> {
  constructor(service: PromotionService) {
    super(service, mapItemToResponse);
  }

  public getDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const item: IPromotion | null = await this.service.getDetail(id);
      res.status(HttpStatus.Success).json(formatResponse(item && mapItemToResponse(item)));
    } catch (error) {
      next(error);
    }
  };

  public changeStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { is_active } = req.body;

      const loggedUserId = req.user!.id;

      const data = await this.service.changeStatus(id, is_active, loggedUserId);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  public getAllPromotionsByFranchiseId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { franchiseId } = req.params;

      const data = await this.service.getAllPromotionsByFranchiseId(franchiseId);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  public getAllPromotionsByProductFranchiseId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productFranchiseId } = req.params;

      const data = await this.service.getAllPromotionsByProductFranchiseId(productFranchiseId);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };
}
