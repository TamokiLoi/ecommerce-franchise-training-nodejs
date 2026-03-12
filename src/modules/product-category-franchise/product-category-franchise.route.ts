import { Router } from "express";
import {
  API_PATH,
  adminAuthMiddleware,
  IRoute,
  requireMoreContext,
  SYSTEM_AND_FRANCHISE_ALL_ROLES,
  SYSTEM_AND_FRANCHISE_MANAGER_ROLES,
  UpdateStatusDto,
  validationMiddleware,
} from "../../core";
import { CreateProductCategoryFranchiseDto } from "./dto/create.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import { UpdateDisplayOrderItemDto } from "./dto/updateDisplayOrder.dto";
import ProductCategoryFranchiseController from "./product-category-franchise.controller";

export default class ProductCategoryFranchiseRoute implements IRoute {
  public path = API_PATH.PRODUCT_CATEGORY_FRANCHISE;
  public router = Router();

  constructor(private readonly controller: ProductCategoryFranchiseController) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * tags:
     *   - name: Product Category Franchise
     *     description: Product Category Franchise related endpoints
     */

    // PATCH domain:/api/product-category-franchises/:id/status - Change status
    this.router.patch(
      API_PATH.PRODUCT_CATEGORY_FRANCHISE_CHANGE_STATUS,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(UpdateStatusDto),
      this.controller.changeStatus,
    );

    // POST domain:/api/product-category-franchises - Create product category franchise
    this.router.post(
      this.path,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(CreateProductCategoryFranchiseDto),
      this.controller.createItem,
    );

    // POST domain:/api/product-category-franchises/search - Search product category franchises
    this.router.post(
      API_PATH.PRODUCT_CATEGORY_FRANCHISE_SEARCH,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(SearchPaginationItemDto, true, {
        enableImplicitConversion: false,
      }),
      this.controller.getItems,
    );

    // GET domain:/api/product-category-franchises/:id - Get detail
    this.router.get(
      API_PATH.PRODUCT_CATEGORY_FRANCHISE_ID,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_ALL_ROLES),
      this.controller.getItem,
    );

    // DELETE domain:/api/product-category-franchises/:id - Soft delete
    this.router.delete(
      API_PATH.PRODUCT_CATEGORY_FRANCHISE_ID,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.softDeleteItem,
    );

    // PATCH domain:/api/product-category-franchises/:id/restore - Restore
    this.router.patch(
      API_PATH.PRODUCT_CATEGORY_FRANCHISE_RESTORE,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.restoreItem,
    );

    // PUT /api/product-category-franchises/reorder -> reorder categories in franchise
    this.router.put(
      API_PATH.PRODUCT_CATEGORY_FRANCHISE_REORDER,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(UpdateDisplayOrderItemDto),
      this.controller.reorder,
    );

    // GET domain:/api/product-category-franchises/:id - Get detail
    this.router.get(
      API_PATH.PRODUCT_CATEGORY_FRANCHISE_ID,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_ALL_ROLES),
      this.controller.getItem,
    );

    // GET domain:/api/product-category-franchises/franchise/:franchiseId - Get products with category by franchise
    this.router.get(
      API_PATH.GET_PRODUCTS_WITH_CATEGORY_BY_FRANCHISE,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.getProductsWithCategories,
    );
  }
}
