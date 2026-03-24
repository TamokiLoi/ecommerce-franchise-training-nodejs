import { ClientSession, Types } from "mongoose";
import { BaseRepository, PaymentMethod, PaymentStatus } from "../../core";
import { IPayment } from "./payment.interface";
import PaymentSchema from "./payment.model";

export class PaymentRepository extends BaseRepository<IPayment> {
  constructor() {
    super(PaymentSchema);
  }

  public async getPaymentByCode(code: string) {
    const payment = await this.model.findOne({ code }).lean();
    return payment;
  }

  public async findByOrderId(orderId: Types.ObjectId, session?: ClientSession): Promise<IPayment | null> {
    const query = this.model.findOne({
      order_id: orderId,
      is_deleted: false,
    });

    if (session) query.session(session);

    return query;
  }

  public async findByCustomerId(
    customerId: string,
    status?: PaymentStatus,
    session?: ClientSession,
  ): Promise<IPayment[]> {
    const filter: any = {
      customer_id: new Types.ObjectId(customerId),
      is_deleted: false,
    };

    if (status) {
      filter.status = status;
    }

    const query = this.model
      .find(filter)
      .populate("franchise_id", "name")
      .populate("customer_id", "name")
      .populate("order_id", "code")
      .sort({ created_at: -1 });

    if (session) query.session(session);

    return query;
  }

  public async findByFranchiseId(
    franchiseId: string,
    status?: PaymentStatus,
    session?: ClientSession,
  ): Promise<IPayment[]> {
    const filter: any = {
      franchise_id: new Types.ObjectId(franchiseId),
      is_deleted: false,
    };

    if (status) {
      filter.status = status;
    }

    const query = this.model
      .find(filter)
      .populate("franchise_id", "name")
      .populate("customer_id", "name")
      .populate("order_id", "code")
      .sort({ created_at: -1 });

    if (session) query.session(session);

    return query;
  }

  public async markAsPaid(
    paymentId: Types.ObjectId,
    method: PaymentMethod,
    providerTxnId?: string,
    session?: ClientSession,
  ): Promise<IPayment | null> {
    const update: any = {
      status: PaymentStatus.PAID,
      method,
      paid_at: new Date(),
    };

    if (providerTxnId) {
      update.provider_txn_id = providerTxnId;
    }

    const query = this.model.findByIdAndUpdate(paymentId, update, { new: true });

    if (session) query.session(session);

    return query;
  }

  public async markAsRefunded(
    paymentId: Types.ObjectId,
    refundReason?: string,
    session?: ClientSession,
  ): Promise<IPayment | null> {
    const query = this.model.findByIdAndUpdate(
      paymentId,
      {
        status: PaymentStatus.REFUNDED,
        refund_reason: refundReason,
        refunded_at: new Date(),
      },
      { new: true },
    );

    if (session) query.session(session);

    return query;
  }

  public async updateStatus(
    paymentId: Types.ObjectId,
    status: PaymentStatus,
    providerTxnId?: string,
    session?: ClientSession,
  ): Promise<IPayment | null> {
    const update: any = { status };

    if (status === PaymentStatus.PAID) {
      update.paid_at = new Date();
    }

    if (providerTxnId) {
      update.provider_txn_id = providerTxnId;
    }

    const query = this.model.findByIdAndUpdate(paymentId, update, { new: true });

    if (session) query.session(session);

    return query;
  }
}
