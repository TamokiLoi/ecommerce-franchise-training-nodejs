import { Router } from "express";
import { API_PATH, IRoute } from "../../core";
import { ClientController } from "./client.controller";

export default class ClientRoute implements IRoute {
  public path = API_PATH.CLIENT;
  public router = Router();

  constructor(private readonly controller: ClientController) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * tags:
     *   - name: Client
     *     description: Client related endpoints
     */

    // GET domain:/api/clients/franchises - Get all franchises for client
    this.router.get(API_PATH.CLIENT_FRANCHISES, this.controller.getFranchises);

    // GET domain:/api/clients/franchises/:franchiseId/categories - Get categories by franchise for client
    this.router.get(API_PATH.CLIENT_CATEGORIES, this.controller.getCategories);

    // GET domain:/api/clients/menu - Get menu for client (?franchiseId=xxx&categoryId=yyy)
    this.router.get(API_PATH.CLIENT_MENU, this.controller.getMenu);

    // GET domain:/api/clients/products?franchiseId=&categoryId= - Get products by franchise and category for client
    this.router.get(API_PATH.CLIENT_PRODUCTS, this.controller.getProducts);

    // GET domain:/api/clients/franchises/:franchiseId/products/:productId - Get product detail for client
    this.router.get(API_PATH.CLIENT_PRODUCT_DETAIL, this.controller.getProductDetail);

    // GET domain:/api/clients/franchises/:franchiseId - Get franchise detail for client
    this.router.get(API_PATH.CLIENT_FRANCHISE_DETAIL, this.controller.getFranchiseDetail);
  }
}
