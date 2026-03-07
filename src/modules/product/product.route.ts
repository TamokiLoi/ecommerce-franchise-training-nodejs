import { Router } from "express";
import { API_PATH, SYSTEM_AND_FRANCHISE_MANAGER_ROLES } from "../../core/constants";
import { IRoute } from "../../core/interfaces";
import { ProductController } from "./product.controller";
import { authMiddleware, requireMoreContext, validationMiddleware } from "../../core/middleware";
import CreateProductDto from "./dto/create.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import UpdateProductDto from "./dto/update.dto";

export default class ProductRoute implements IRoute {
  public path = API_PATH.PRODUCT;
  public router = Router();

  constructor(private readonly controller: ProductController) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * tags:
     *   - name: Product
     *     description: Product related endpoints
     */

    // GET domain:/api/products/select - Get all products for select option
    this.router.get(
      API_PATH.PRODUCT_SELECT,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.getAllItems,
    );

    // POST domain:/api/products - Create product
    this.router.post(
      this.path,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(CreateProductDto),
      this.controller.createItem,
    );

    // POST domain:/api/products/search - Get all products (pagination + filter)
    this.router.post(
      API_PATH.PRODUCT_SEARCH,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(SearchPaginationItemDto, true, {
        enableImplicitConversion: false,
      }),
      this.controller.getItems,
    );

    // GET domain:/api/products/:id - Get product by id
    this.router.get(
      API_PATH.PRODUCT_ID,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.getItem,
    );

    // PUT domain:/api/products/:id - Update product
    this.router.put(
      API_PATH.PRODUCT_ID,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(UpdateProductDto),
      this.controller.updateItem,
    );

    // DELETE domain:/api/products/:id - Soft delete product
    this.router.delete(
      API_PATH.PRODUCT_ID,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.softDeleteItem,
    );

    // PATCH domain:/api/products/:id/restore - Restore soft deleted product
    this.router.patch(
      API_PATH.PRODUCT_RESTORE,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.restoreItem,
    );
  }
}
