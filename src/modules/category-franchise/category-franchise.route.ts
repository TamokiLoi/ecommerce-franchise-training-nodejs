import { Router } from "express";
import { API_PATH, SYSTEM_ADMIN_ROLES, SYSTEM_AND_FRANCHISE_MANAGER_ROLES } from "../../core/constants";
import { IRoute } from "../../core/interfaces";
import { authMiddleware, requireMoreContext, validationMiddleware } from "../../core/middleware";
import { CategoryFranchiseController } from "./category-franchise.controller";
import CreateCategoryFranchiseDto from "./dto/create.dto";
import { UpdateDisplayOrderItemDto, UpdateDisplayOrderItemsDto } from "./dto/updateDisplayOrder.dto";
import UpdateStatusDto from "./dto/updateStatus.dto";

export default class CategoryFranchiseRoute implements IRoute {
  public path = API_PATH.CATEGORY_FRANCHISE;
  public router = Router();

  constructor(private readonly controller: CategoryFranchiseController) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * tags:
     *   - name: Category Franchise
     *     description: Franchise menu category endpoints
     */

    // POST /api/category-franchises -> add category to franchise
    this.router.post(
      this.path,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(CreateCategoryFranchiseDto),
      this.controller.addCategory,
    );

    // GET /api/category-franchises/franchise/:franchiseId -> get categories by franchise
    this.router.get(API_PATH.GET_CATEGORIES_BY_FRANCHISE, authMiddleware(), this.controller.getByFranchise);

    // PATCH /api/category-franchises/:id/status -> change status
    this.router.patch(
      API_PATH.CATEGORY_FRANCHISE_CHANGE_STATUS,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(UpdateStatusDto),
      this.controller.changeStatus,
    );

    // PATCH /api/category-franchises/display-order -> change display order
    this.router.patch(
      API_PATH.CATEGORY_FRANCHISE_CHANGE_DISPLAY_ORDER,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(UpdateDisplayOrderItemDto),
      this.controller.changeDisplayOrder,
    );

    // PUT /api/franchises/:franchiseId/categories/reorder -> reorder categories in franchise
    this.router.put(
      API_PATH.CATEGORY_FRANCHISE_REORDER,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(UpdateDisplayOrderItemsDto),
      this.controller.reorder,
    );

    // DELETE /api/category-franchises/:id -> remove category from franchise
    this.router.delete(
      API_PATH.CATEGORY_FRANCHISE_ID,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.remove,
    );

    // PATCH /api/category-franchises/:id/restore -> restore category from franchise
    this.router.patch(
      API_PATH.CATEGORY_FRANCHISE_RESTORE,
      authMiddleware(),
      requireMoreContext(SYSTEM_ADMIN_ROLES),
      this.controller.restore,
    );
  }
}
