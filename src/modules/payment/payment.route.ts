import { Router } from "express";
import { API_PATH, authMiddleware, IRoute } from "../../core";
import { PaymentController } from "./payment.controller";

export default class PaymentRoute implements IRoute {
  public path = API_PATH.PAYMENT;
  public router = Router();

  constructor(private readonly controller: PaymentController) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * tags:
     *   - name: Payment
     *     description: Payment related endpoints
     */

    // PUT domain:/api/payments/:id/confirm - Confirm payment
    this.router.put(API_PATH.CONFIRM_PAYMENT, authMiddleware(), this.controller.confirmPayment);

    // PUT domain:/api/payments/:id/refund - Confirm payment
    this.router.put(API_PATH.REFUND_PAYMENT, authMiddleware(), this.controller.refundPayment);

    // PUT domain:/api/payments/:id/retry - Confirm payment
    // this.router.put(API_PATH.RETRY_PAYMENT, authMiddleware(), this.controller.confirmPayment);

    // PUT domain:/api/payments/:id/failed - Confirm payment
    // this.router.put(API_PATH.PAYMENT_FAILED, authMiddleware(), this.controller.confirmPayment);

    // GET domain:/api/payments/code?code= - Get payment detail by code
    this.router.get(API_PATH.PAYMENT_CODE, authMiddleware(), this.controller.getPaymentDetailByCode);

    // GET domain:/api/payments/:id - Get payment detail
    this.router.get(API_PATH.PAYMENT_ID, authMiddleware(), this.controller.getPaymentDetail);

    // GET domain:/api/payments/order/:orderId - Get payment by order
    this.router.get(API_PATH.GET_PAYMENT_BY_ORDER, authMiddleware(), this.controller.getPaymentByOrderId);

    // GET domain:/api/payments/customer/:customerId - Get payment by customer
    this.router.get(API_PATH.GET_PAYMENTS_BY_CUSTOMER, authMiddleware(), this.controller.getPaymentsByCustomerId);

    // GET domain:/api/payments/franchise/:franchiseId - Get payment by franchise
    this.router.get(API_PATH.GET_PAYMENTS_BY_FRANCHISE, authMiddleware(), this.controller.getPaymentsByFranchiseId);
  }
}
