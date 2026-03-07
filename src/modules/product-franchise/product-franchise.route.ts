import { Router } from "express";
import {
  API_PATH,
  SYSTEM_ADMIN_ROLES,
  SYSTEM_AND_FRANCHISE_ALL_ROLES,
  SYSTEM_AND_FRANCHISE_MANAGER_ROLES,
} from "../../core/constants";
import { IRoute } from "../../core/interfaces";
import ProductFranchiseController from "./product-franchise.controller";
import { authMiddleware, requireMoreContext, validationMiddleware } from "../../core/middleware";
import { UpdateStatusDto } from "../../core/dto";
import { CreateProductFranchiseDto } from "./dto/create.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import { UpdateProductFranchiseDto } from "./dto/update.dto";

export default class ProductFranchiseRoute implements IRoute {
  public path = API_PATH.PRODUCT_FRANCHISE;
  public router = Router();

  constructor(private readonly controller: ProductFranchiseController) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * tags:
     *   - name: Product Franchise
     *     description: Product Franchise related endpoints
     */

    // GET /api/product-franchises/franchise/:franchiseId -> get products by franchise
    this.router.get(
      API_PATH.GET_PRODUCTS_BY_FRANCHISE,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.getByFranchise,
    );

    // PATCH domain:/api/product-franchises/:id/status - Change status
    this.router.patch(
      API_PATH.PRODUCT_FRANCHISE_CHANGE_STATUS,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(UpdateStatusDto),
      this.controller.changeStatus,
    );

    // POST domain:/api/product-franchises - Create product franchise
    this.router.post(
      this.path,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(CreateProductFranchiseDto),
      this.controller.createItem,
    );

    // POST domain:/api/product-franchises/search - Search product franchises
    this.router.post(
      API_PATH.PRODUCT_FRANCHISE_SEARCH,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_ALL_ROLES),
      validationMiddleware(SearchPaginationItemDto, true, {
        enableImplicitConversion: false,
      }),
      this.controller.getItems,
    );

    // GET domain:/api/product-franchises/:id - Get detail
    this.router.get(
      API_PATH.PRODUCT_FRANCHISE_ID,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_ALL_ROLES),
      this.controller.getItem,
    );

    // PUT domain:/api/product-franchises/:id - Update
    this.router.put(
      API_PATH.PRODUCT_FRANCHISE_ID,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(UpdateProductFranchiseDto),
      this.controller.updateItem,
    );

    // DELETE domain:/api/product-franchises/:id - Soft delete
    this.router.delete(
      API_PATH.PRODUCT_FRANCHISE_ID,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.softDeleteItem,
    );

    // PATCH domain:/api/product-franchises/:id/restore - Restore
    this.router.patch(
      API_PATH.PRODUCT_FRANCHISE_RESTORE,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.restoreItem,
    );
  }
}
