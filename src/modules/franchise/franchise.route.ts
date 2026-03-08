import { Router } from "express";
import { API_PATH, SYSTEM_ADMIN_ROLES } from "../../core/constants";
import { UpdateStatusDto } from "../../core/dto";
import { IRoute } from "../../core/interfaces";
import { authMiddleware, requireMoreContext, validationMiddleware } from "../../core/middleware";
import CreateFranchiseDto from "./dto/create.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import UpdateFranchiseDto from "./dto/update.dto";
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

    // TODO: check again when have module customer
    // GET domain:/api/franchises/select - Get all franchises for select option
    this.router.get("/select", this.controller.getAllFranchises);

    // PATCH domain:/api/franchises/:id/status - Update status franchise
    this.router.patch(
      "/:id/status",
      authMiddleware(),
      requireMoreContext(SYSTEM_ADMIN_ROLES),
      validationMiddleware(UpdateStatusDto),
      this.controller.changeStatus,
    );

    // POST domain:/api/franchises - Create franchise
    this.router.post(
      this.path,
      authMiddleware(),
      requireMoreContext(SYSTEM_ADMIN_ROLES),
      validationMiddleware(CreateFranchiseDto),
      this.controller.createItem,
    );

    // POST domain:/api/franchises/search - Get all franchises
    this.router.post(
      "/search",
      authMiddleware(),
      requireMoreContext(SYSTEM_ADMIN_ROLES),
      validationMiddleware(SearchPaginationItemDto, true, {
        enableImplicitConversion: false,
      }),
      this.controller.getItems,
    );

    // GET domain:/api/franchises/:id - Get franchise by id
    this.router.get(
      "/:id",
      authMiddleware(),
      requireMoreContext(SYSTEM_ADMIN_ROLES),
      this.controller.getItem,
    );

    // PUT domain:/api/franchises/:id - Update franchise
    this.router.put(
      "/:id",
      authMiddleware(),
      requireMoreContext(SYSTEM_ADMIN_ROLES),
      validationMiddleware(UpdateFranchiseDto),
      this.controller.updateItem,
    );

    // DELETE domain:/api/franchises/:id - Soft delete franchise
    this.router.delete(
      "/:id",
      authMiddleware(),
      requireMoreContext(SYSTEM_ADMIN_ROLES),
      this.controller.softDeleteItem,
    );

    // PATCH domain:/api/franchises/:id/restore - Restore soft deleted franchise
    this.router.patch(
      "/:id/restore",
      authMiddleware(),
      requireMoreContext(SYSTEM_ADMIN_ROLES),
      this.controller.restoreItem,
    );
  }
}
