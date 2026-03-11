import { Router } from "express";
import { API_PATH, SYSTEM_AND_FRANCHISE_MANAGER_ROLES } from "../../core/constants";
import { IRoute } from "../../core/interfaces";
import { adminAuthMiddleware, requireMoreContext, validationMiddleware } from "../../core/middleware";
import { CreatePromotionDto } from "./dto/create.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import { UpdatePromotionDto } from "./dto/update.dto";
import { PromotionController } from "./promotion.controller";

export default class PromotionRoute implements IRoute {
  public path = API_PATH.PROMOTION;
  public router = Router();

  constructor(private readonly controller: PromotionController) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * tags:
     *   - name: Promotion
     *     description: Promotion related endpoints
     */

    // PATCH /api/promotions/:id/status - Change status
    this.router.patch(
      API_PATH.PROMOTION_CHANGE_STATUS,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(
        class {
          is_active!: boolean;
        },
      ),
      this.controller.changeStatus,
    );

    // GET /api/promotions/franchise/:franchiseId - Get by franchise id
    this.router.get(
      API_PATH.GET_PROMOTIONS_BY_FRANCHISE,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.getAllPromotionsByFranchiseId,
    );

    // GET /api/promotions/product-franchise/:productFranchiseId - Get by product franchise name
    this.router.get(
      API_PATH.GET_PROMOTIONS_BY_PRODUCT_FRANCHISE,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.getAllPromotionsByProductFranchiseId,
    );

    // POST /api/promotions - Create promotion
    this.router.post(
      this.path,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(CreatePromotionDto),
      this.controller.createItem,
    );

    // POST /api/promotions/search - Search promotions
    this.router.post(
      API_PATH.PROMOTION_SEARCH,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(SearchPaginationItemDto, true, {
        enableImplicitConversion: false,
      }),
      this.controller.getItems,
    );

    // GET /api/promotions/:id - Get by id
    this.router.get(
      API_PATH.PROMOTION_ID,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.getDetail,
    );

    // PUT /api/promotions/:id - Update
    this.router.put(
      API_PATH.PROMOTION_ID,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(UpdatePromotionDto),
      this.controller.updateItem,
    );

    // DELETE /api/promotions/:id - Soft delete
    this.router.delete(
      API_PATH.PROMOTION_ID,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.softDeleteItem,
    );

    // PATCH /api/promotions/:id/restore - Restore
    this.router.patch(
      API_PATH.PROMOTION_RESTORE,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.restoreItem,
    );
  }
}
