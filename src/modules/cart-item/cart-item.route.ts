import { Router } from "express";
import { API_PATH, IRoute } from "../../core";
import { CartItemController } from "./cart-item.controller";

export default class CartItemRoute implements IRoute {
  public path = API_PATH.CART_ITEM;
  public router = Router();

  constructor(private readonly controller: CartItemController) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * tags:
     *   - name: CartItem
     *     description: CartItem related endpoints
     */
  }
}
