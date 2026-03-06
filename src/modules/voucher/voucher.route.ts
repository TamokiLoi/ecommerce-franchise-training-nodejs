import { Router } from "express";
import {
  API_PATH,
  SYSTEM_AND_FRANCHISE_MANAGER_ROLES,
} from "../../core/constants";
import { IRoute } from "../../core/interfaces";
import { VoucherController } from "./voucher.controller";
import {
  authMiddleware,
  requireMoreContext,
  validationMiddleware,
} from "../../core/middleware";
import { CreateVoucherDto } from "./dto/create.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import { UpdateVoucherDto } from "./dto/update.dto";

export default class VoucherRoute implements IRoute {
  public path = API_PATH.VOUCHER;
  public router = Router();

  constructor(private readonly controller: VoucherController) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // POST /api/vouchers - Create voucher
    this.router.post(
      this.path,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(CreateVoucherDto),
      this.controller.createItem,
    );

    // POST /api/vouchers/search - Search vouchers
    this.router.post(
      API_PATH.VOUCHER_SEARCH,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(SearchPaginationItemDto, true, {
        enableImplicitConversion: false,
      }),
      this.controller.getItems,
    );

    // GET /api/vouchers/:id - Get by id
    this.router.get(
      API_PATH.VOUCHER_ID,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.getItem,
    );

    // GET /api/vouchers/franchise/:franchiseId - Get by franchise id
    this.router.get(
      `${this.path}/franchise/:franchiseId`,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.getAllVoucherByFranchiseId,
    );

    // GET /api/vouchers/product-franchise/:productFranchiseId - Get by product franchise id
    this.router.get(
      `${this.path}/product-franchise/:productFranchiseId`,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.getAllVoucherByProductFranchiseId,
    );

    // PUT /api/vouchers/:id - Update
    this.router.put(
      API_PATH.VOUCHER_ID,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(UpdateVoucherDto),
      this.controller.updateItem,
    );

    // DELETE /api/vouchers/:id - Soft delete
    this.router.delete(
      API_PATH.VOUCHER_ID,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.softDeleteItem,
    );

    // PATCH /api/vouchers/:id/restore - Restore
    this.router.patch(
      API_PATH.VOUCHER_RESTORE,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.restoreItem,
    );

    // PATCH /api/vouchers/:id/status - Change status
    this.router.patch(
      `${this.path}/:id/status`,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.changeStatus,
    );
  }
}
