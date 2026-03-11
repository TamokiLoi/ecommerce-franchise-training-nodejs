import { formatResponse, HttpStatus } from "../../core";
import { BaseCrudController } from "../../core/controller";
import { CreateVoucherDto } from "./dto/create.dto";
import { VoucherItemDto } from "./dto/item.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import { UpdateVoucherDto } from "./dto/update.dto";
import { IVoucher } from "./voucher.interface";
import { mapItemToResponse } from "./voucher.mapper";
import { VoucherService } from "./voucher.service";
import { Request, Response, NextFunction } from "express";

export class VoucherController extends BaseCrudController<
  IVoucher,
  CreateVoucherDto,
  UpdateVoucherDto,
  SearchPaginationItemDto,
  VoucherItemDto,
  VoucherService
> {
  constructor(service: VoucherService) {
    super(service, mapItemToResponse);
  }

  public getDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const item: IVoucher | null = await this.service.getDetail(id);
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

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public getAllVoucherByFranchiseId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { franchiseId } = req.params;

      const data = await this.service.getAllVoucherByFranchiseId(franchiseId);

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public getAllVoucherByProductFranchiseId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productFranchiseId } = req.params;

      const data = await this.service.getAllVoucherByProductFranchiseId(productFranchiseId);

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
