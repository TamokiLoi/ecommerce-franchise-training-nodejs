import { Router } from "express";
import { API_PATH } from "../../core/constants";
import { BaseRole } from "../../core/enums";
import { IRoute } from "../../core/interfaces";
import { authMiddleware, roleGuard, validationMiddleware } from "../../core/middleware";
import CreateFranchiseDto from "./dto/create.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import UpdateFranchiseDto from "./dto/update.dto";
import UpdateStatusDto from "./dto/updateStatus.dto";
import FranchiseController from "./franchise.controller";

export default class FranchiseRoute implements IRoute {
  public path = API_PATH.FRANCHISE;
  public router = Router();

  constructor(private readonly controller: FranchiseController) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * tags:
     *   - name: Franchise
     *     description: Franchise related endpoints
     */

    // POST domain:/api/franchise - Create franchise
    this.router.post(
      this.path,
      authMiddleware(),
      roleGuard([BaseRole.ADMIN]),
      validationMiddleware(CreateFranchiseDto),
      this.controller.createItem,
    );

    // GET domain:/api/franchise/:id - Get franchise by id
    this.router.get(API_PATH.FRANCHISE_ID, authMiddleware(), this.controller.getItem);

    // POST domain:/api/franchise - Get all franchises
    this.router.post(
      API_PATH.FRANCHISE_SEARCH,
      authMiddleware(),
      validationMiddleware(SearchPaginationItemDto, true, {
        enableImplicitConversion: false,
      }),
      this.controller.getItems,
    );

    // PUT domain:/api/franchise/:id - Update franchise
    this.router.put(
      API_PATH.FRANCHISE_ID,
      authMiddleware(),
      roleGuard([BaseRole.ADMIN]),
      validationMiddleware(UpdateFranchiseDto),
      this.controller.updateItem,
    );

    // PATCH domain:/api/franchise/:id/status - Update status franchise
    this.router.patch(
      API_PATH.FRANCHISE_CHANGE_STATUS,
      authMiddleware(),
      roleGuard([BaseRole.ADMIN]),
      validationMiddleware(UpdateStatusDto),
      this.controller.changeStatus,
    );

    // DELETE domain:/api/franchise/:id - Soft delete franchise
    this.router.delete(
      API_PATH.FRANCHISE_ID,
      authMiddleware(),
      roleGuard([BaseRole.ADMIN]),
      this.controller.softDeleteItem,
    );

    // PATCH domain:/api/franchise/:id/restore - Restore soft deleted franchise
    this.router.patch(
      API_PATH.FRANCHISE_RESTORE,
      authMiddleware(),
      roleGuard([BaseRole.ADMIN]),
      this.controller.restoreItem,
    );
  }
}
