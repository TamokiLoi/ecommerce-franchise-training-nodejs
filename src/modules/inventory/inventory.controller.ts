import { AuthenticatedRequest, BaseCrudController, formatResponse, HttpStatus } from "../../core";
import { CreateInventoryDto } from "./dto/create.dto";
import { InventoryItemDto } from "./dto/item.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import { UpdateInventoryQuantityDto } from "./dto/update.dto";
import { InventoryReferenceType } from "./inventory.enum";
import { IInventory } from "./inventory.interface";
import { mapItemToResponse } from "./inventory.mapper";
import { InventoryService } from "./inventory.service";
import { NextFunction, Request, Response } from "express";

export default class InventoryController extends BaseCrudController<
  IInventory,
  CreateInventoryDto,
  never,
  SearchPaginationItemDto,
  InventoryItemDto,
  InventoryService
> {
  constructor(service: InventoryService) {
    super(service, mapItemToResponse);
  }

  // ===== Adjust stock =====
  public adjustStock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload: UpdateInventoryQuantityDto = req.body;
      await this.service.adjustStock(payload, (req as AuthenticatedRequest).user.id);
      res.status(HttpStatus.Success).json(formatResponse<null>(null));
    } catch (error) {
      next(error);
    }
  };

  // ===== Reserve stock (internal / order service) =====
  public reserveStock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productFranchiseId } = req.params;
      const { quantity, orderId } = req.body;

      await this.service.reserveStock(productFranchiseId, quantity, orderId, (req as AuthenticatedRequest).user.id);

      res.status(HttpStatus.Success).json(formatResponse<null>(null));
    } catch (error) {
      next(error);
    }
  };

  // ===== Release stock =====
  public releaseStock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productFranchiseId } = req.params;
      const { quantity, orderId } = req.body;

      await this.service.releaseStock(productFranchiseId, quantity, orderId, (req as AuthenticatedRequest).user.id);

      res.status(HttpStatus.Success).json(formatResponse<null>(null));
    } catch (error) {
      next(error);
    }
  };

  // ===== Deduct stock =====
  public deductStock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productFranchiseId } = req.params;
      const { quantity, orderId } = req.body;

      await this.service.deductStock(productFranchiseId, quantity, orderId, (req as AuthenticatedRequest).user.id);

      res.status(HttpStatus.Success).json(formatResponse<null>(null));
    } catch (error) {
      next(error);
    }
  };

  // ===== Get low stock =====
  public getLowStock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { franchiseId } = req.params;
      const result = await this.service.findLowStock(franchiseId as string);
      res.status(HttpStatus.Success).json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  // ===== Get inventory logs =====
  public getLogsByInventory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { inventoryId } = req.params;
      const result = await this.service.getLogsByInventory(inventoryId as string);
      res.status(HttpStatus.Success).json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  // ===== Get logs by reference =====
  public getLogsByReference = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { referenceType, referenceId } = req.query;

      const result = await this.service.getLogsByReference(
        referenceType as InventoryReferenceType,
        referenceId as string,
      );

      res.status(HttpStatus.Success).json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };
}
