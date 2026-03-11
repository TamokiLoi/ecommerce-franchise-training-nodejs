import { Router } from "express";
import { API_PATH, SYSTEM_AND_FRANCHISE_MANAGER_ROLES } from "../../core/constants";
import { IRoute } from "../../core/interfaces";
import { VoucherController } from "./voucher.controller";
import { adminAuthMiddleware, requireMoreContext, validationMiddleware } from "../../core/middleware";
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
    /**
     * @swagger
     * tags:
     *   - name: Voucher
     *     description: Voucher related endpoints
     */

    // PATCH /api/vouchers/:id/status - Change status
    this.router.patch(
      API_PATH.VOUCHER_CHANGE_STATUS,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.changeStatus,
    );

    // GET /api/vouchers/franchise/:franchiseId - Get by franchise id
    this.router.get(
      API_PATH.GET_VOUCHERS_BY_FRANCHISE,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.getAllVoucherByFranchiseId,
    );

    // GET /api/vouchers/product-franchise/:productFranchiseId - Get by product franchise id
    this.router.get(
      API_PATH.GET_VOUCHERS_BY_PRODUCT_FRANCHISE,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.getAllVoucherByProductFranchiseId,
    );

    // POST /api/vouchers - Create voucher
    this.router.post(
      this.path,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(CreateVoucherDto),
      this.controller.createItem,
    );

    // POST /api/vouchers/search - Search vouchers
    this.router.post(
      API_PATH.VOUCHER_SEARCH,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(SearchPaginationItemDto, true, {
        enableImplicitConversion: false,
      }),
      this.controller.getItems,
    );

    // GET /api/vouchers/:id - Get by id
    this.router.get(
      API_PATH.VOUCHER_ID,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.getItem,
    );

    // PUT /api/vouchers/:id - Update
    this.router.put(
      API_PATH.VOUCHER_ID,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(UpdateVoucherDto),
      this.controller.updateItem,
    );

    // DELETE /api/vouchers/:id - Soft delete
    this.router.delete(
      API_PATH.VOUCHER_ID,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.softDeleteItem,
    );

    // PATCH /api/vouchers/:id/restore - Restore
    this.router.patch(
      API_PATH.VOUCHER_RESTORE,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.restoreItem,
    );
  }
}
