import { Router } from "express";
import { adminAuthMiddleware, API_PATH, authMiddleware, IRoute } from "../../core";
import { OrderController } from "./order.controller";

export default class OrderRoute implements IRoute {
  public path = API_PATH.ORDER;
  public router = Router();

  constructor(private readonly controller: OrderController) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * tags:
     *   - name: Order
     *     description: Order related endpoints
     */

    // GET domain:/api/orders/code?code= - Get order detail by code
    this.router.get(API_PATH.ORDER_CODE, authMiddleware(), this.controller.getOrderDetailByCode);

    // GET domain:/api/orders/:id - Get order detail
    this.router.get(API_PATH.ORDER_ID, authMiddleware(), this.controller.getOrderDetail);

    // GET domain:/api/orders/cart/:cartId - Get order by cart
    this.router.get(API_PATH.GET_ORDER_BY_CART, authMiddleware(), this.controller.getOrderByCartId);

    // GET domain:/api/orders/customer/:customerId - Get order by customer
    this.router.get(API_PATH.GET_ORDERS_BY_CUSTOMER, authMiddleware(), this.controller.getOrdersByCustomerId);

    // GET domain:/api/orders/franchise/:franchiseId - Get order by franchise
    this.router.get(API_PATH.GET_ORDERS_BY_FRANCHISE, adminAuthMiddleware(), this.controller.getOrdersForStaff);

    // GET domain:/api/orders/:id/preparing - Start preparing order 
    this.router.get(API_PATH.PREPARING_ORDER, adminAuthMiddleware(), this.controller.markPreparingOrder);
    
    // GET domain:/api/orders/:id/preparing - Start preparing order 
    this.router.get(API_PATH.PREPARING_ORDER, adminAuthMiddleware(), this.controller.markPreparingOrder);
  }
}
