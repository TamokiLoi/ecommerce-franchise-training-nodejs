import mongoose, { ClientSession, Types } from "mongoose";
import {
  BaseFieldName,
  CustomerAuthPayload,
  genPaymentCode,
  HttpException,
  HttpStatus,
  OrderStatus,
  PaymentStatus,
  UserAuthPayload,
  UserType,
} from "../../core";
import { IAuditLogger } from "../audit-log";
import { ICustomerFranchiseQuery } from "../customer-franchise";
import { IOrder, IOrderQuery } from "../order";
import { IVoucherQuery } from "../voucher";
import { ConfirmPaymentDto } from "./dto/confirm.dto";
import { RefundPaymentDto } from "./dto/refund.dto";
import { IPayment, IPaymentQuery } from "./payment.interface";
import { PaymentRepository } from "./payment.repository";

export class PaymentService implements IPaymentQuery {
  private readonly paymentRepository: PaymentRepository;

  constructor(
    repo: PaymentRepository,
    private readonly auditLogger: IAuditLogger,
    private readonly orderQuery: IOrderQuery,
    private readonly voucherQuery: IVoucherQuery,
    private readonly customerFranchiseQuery: ICustomerFranchiseQuery,
  ) {
    this.paymentRepository = repo;
  }

  public async createPayment(
    order: IOrder,
    loggedUser: UserAuthPayload | CustomerAuthPayload,
    session?: ClientSession,
  ): Promise<IPayment> {
    // 0: Check unique code
    let code = genPaymentCode();
    while (await this.paymentRepository.existsByField(BaseFieldName.CODE, code)) {
      code = genPaymentCode();
    }

    // 1️⃣ Check order already paid
    const existingPayment = await this.paymentRepository.findByOrderId(order._id, session);

    if (existingPayment && existingPayment.status === PaymentStatus.PAID) {
      throw new HttpException(HttpStatus.BadRequest, "Order already paid");
    }

    // 2️⃣ Create payment
    const payment = await this.paymentRepository.create(
      {
        code: code,
        franchise_id: order.franchise_id,
        customer_id: order.customer_id,
        order_id: order._id,
        amount: order.final_amount,
        status: PaymentStatus.PENDING,
        created_by: loggedUser.type === UserType.USER ? new Types.ObjectId(loggedUser.id) : undefined,
      },
      session,
    );

    return payment;
  }

  public async getPaymentDetail(id: string): Promise<IPayment> {
    const item = await this.paymentRepository.findById(id);

    if (!item) {
      throw new HttpException(HttpStatus.BadRequest, "Payment not found");
    }

    return item;
  }

  public async getPaymentDetailByCode(code: string): Promise<IPayment> {
    const item = await this.paymentRepository.getPaymentByCode(code);

    if (!item) {
      throw new HttpException(HttpStatus.BadRequest, "Payment not found");
    }

    return item;
  }

  public async getPaymentByOrderId(orderId: string, session?: ClientSession): Promise<IPayment> {
    const item = await this.paymentRepository.findByOrderId(new Types.ObjectId(orderId), session);

    if (!item) {
      throw new HttpException(HttpStatus.BadRequest, "Payment not found");
    }

    return item;
  }

  public async getPaymentsByCustomerId(
    customerId: Types.ObjectId,
    status?: PaymentStatus,
    session?: ClientSession,
  ): Promise<IPayment[]> {
    return this.paymentRepository.findByCustomerId(customerId, status, session);
  }

  public async confirmPayment(
    id: string,
    payload: ConfirmPaymentDto,
    loggedUser: UserAuthPayload | CustomerAuthPayload,
  ): Promise<IPayment> {
    const paymentId = new Types.ObjectId(id);
    const { method, providerTxnId } = payload;

    const session = await mongoose.startSession();

    try {
      session.startTransaction();
      // 1: Get payment
      const payment = await this.paymentRepository.findByIdWithSession(String(paymentId), session);

      if (!payment) {
        throw new HttpException(HttpStatus.BadRequest, "Payment not found");
      }

      if (payment.status !== PaymentStatus.PENDING) {
        throw new HttpException(HttpStatus.BadRequest, "Payment already processed");
      }

      // 2: Get order
      const order = await this.orderQuery.getByIdWithSession(String(payment.order_id), session);

      if (!order) {
        throw new HttpException(HttpStatus.BadRequest, "Order not found");
      }

      if (order.status !== OrderStatus.DRAFT) {
        throw new HttpException(HttpStatus.BadRequest, "Order already confirmed");
      }

      // 3: Decrease voucher quota (if exists)
      if (order.voucher_id) {
        const updatedVoucher = await this.voucherQuery.decreaseQuotaById(order.voucher_id, session);

        if (!updatedVoucher) {
          throw new HttpException(HttpStatus.BadRequest, "Voucher failed to decrease quota");
        }
      }

      // 4: Update payment → PAID
      const updatedPayment = await this.paymentRepository.markAsPaid(paymentId, method, providerTxnId, session);

      if (!updatedPayment) {
        throw new HttpException(HttpStatus.BadRequest, "Update payment failed");
      }

      // 5: Add points to customer
      await this.customerFranchiseQuery.addPoints(
        {
          orderId: order._id,
          customerId: order.customer_id,
          franchiseId: order.franchise_id,
          final_amount: order.final_amount,
          loggedUser,
        },
        session,
      );

      // 6: Confirm order
      await this.orderQuery.confirmOrder(order._id, loggedUser, session);

      // 7: Commit transaction
      await session.commitTransaction();

      return updatedPayment;
    } catch (error: any) {
      await session.abortTransaction();

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(HttpStatus.BadRequest, error?.message || "Confirm payment failed");
    } finally {
      await session.endSession();
    }
  }

  public async refundPayment(
    id: string,
    payload: RefundPaymentDto,
    loggedUser: UserAuthPayload | CustomerAuthPayload,
  ): Promise<IPayment> {
    const { refund_reason } = payload;
    const paymentId = new Types.ObjectId(id);
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // 1️⃣ Get payment
      const payment = await this.paymentRepository.findByIdWithSession(String(paymentId), session);

      if (!payment) {
        throw new HttpException(HttpStatus.BadRequest, "Payment not found");
      }

      if (payment.status !== PaymentStatus.PAID) {
        throw new HttpException(HttpStatus.BadRequest, "Payment is not paid");
      }

      // 2️⃣ Get order
      const order = await this.orderQuery.getByIdWithSession(String(payment.order_id), session);

      if (!order) {
        throw new HttpException(HttpStatus.BadRequest, "Order not found");
      }

      if (order.status !== OrderStatus.CONFIRMED) {
        throw new HttpException(HttpStatus.BadRequest, "Order cannot be refunded");
      }

      // 3️⃣ Update payment
      const updatedPayment = await this.paymentRepository.markAsRefunded(paymentId, refund_reason, session);

      if (!updatedPayment) {
        throw new HttpException(HttpStatus.BadRequest, "Update payment failed");
      }

      // 4️⃣ Increase voucher quota (if exists)
      if (order.voucher_id) {
        const updatedVoucher = await this.voucherQuery.increaseQuotaById(order.voucher_id, session);

        if (!updatedVoucher) {
          throw new HttpException(HttpStatus.BadRequest, "Voucher failed to restore quota");
        }
      }

      // 5️⃣ Revert loyalty points
      await this.customerFranchiseQuery.revertPoints(
        {
          orderId: order._id,
          customerId: order.customer_id,
          franchiseId: order.franchise_id,
          final_amount: order.final_amount,
          refundReason: refund_reason,
          loggedUser,
        },
        session,
      );

      // 6️⃣ Revert used loyalty points
      if (order?.loyalty_points_used > 0) {
        await this.customerFranchiseQuery.restoreUsedPoints(
          {
            orderId: order._id,
            customerId: order.customer_id,
            franchiseId: order.franchise_id,
            points: order.loyalty_points_used ?? 0,
            refundReason: refund_reason,
            loggedUser,
          },
          session,
        );
      }

      // 7️⃣ Cancel order
      await this.orderQuery.cancelOrder(order._id, refund_reason, loggedUser, session);

      await session.commitTransaction();

      return updatedPayment;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // External dependencies
  public async getById(id: string): Promise<IPayment | null> {
    return this.paymentRepository.findById(id);
  }
}
