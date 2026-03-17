import mongoose, { ClientSession, Types } from "mongoose";
import {
  BaseFieldName,
  CustomerAuthPayload,
  DeliveryStatus,
  genOrderCode,
  HttpException,
  HttpStatus,
  OrderStatus,
  OrderType,
  UserAuthPayload,
  UserType,
} from "../../core";
import { AuditAction, AuditEntityType, IAuditLogger } from "../audit-log";
import { ICart } from "../cart";
import { ICustomerFranchiseQuery } from "../customer-franchise";
import { IInventoryQuery } from "../inventory";
import { IOrderItemQuery } from "../order-item";
import { IOrderStatusLogger } from "../order-status-log";
import { IOrder, IOrderQuery } from "./order.interface";
import { OrderRepository } from "./order.repository";
import { IDeliveryQuery } from "../delivery";

export class OrderService implements IOrderQuery {
  private readonly orderRepo: OrderRepository;

  constructor(
    repo: OrderRepository,
    private readonly auditLogger: IAuditLogger,
    private readonly orderStatusLogger: IOrderStatusLogger,
    private readonly orderItemQuery: IOrderItemQuery,
    private readonly inventoryQuery: IInventoryQuery,
    private readonly deliveryQuery: IDeliveryQuery,
    private readonly customerFranchiseQuery: ICustomerFranchiseQuery,
  ) {
    this.orderRepo = repo;
  }

  public async createOrder(
    cart: ICart,
    loggedUser: UserAuthPayload | CustomerAuthPayload,
    session?: ClientSession,
  ): Promise<IOrder> {
    const { customer_id, franchise_id } = cart;

    // 0: Check orderType
    const orderType = loggedUser.context ? OrderType.POS : OrderType.ONLINE;

    // 1: Check customer franchise
    let customerFranchise = await this.customerFranchiseQuery.findByCustomerAndFranchise(
      customer_id,
      franchise_id,
      session,
    );

    if (!customerFranchise) {
      customerFranchise = await this.customerFranchiseQuery.createCustomerFranchise(
        { customer_id, franchise_id },
        loggedUser.id,
        session,
      );
    }

    // 2: Check unique code
    let code = genOrderCode();
    while (await this.orderRepo.existsByField(BaseFieldName.CODE, code)) {
      code = genOrderCode();
    }

    // 3: Create order
    const order = await this.orderRepo.create(
      {
        cart_id: cart._id,
        customer_id: cart.customer_id,
        franchise_id: cart.franchise_id,
        staff_id: cart.staff_id,

        type: orderType,
        code,

        address: cart.address,
        phone: cart.phone,
        message: cart.message,

        promotion_discount: cart.promotion_discount,
        voucher_discount: cart.voucher_discount,
        loyalty_discount: cart.loyalty_discount,

        subtotal_amount: cart.subtotal_amount,
        final_amount: cart.final_amount,

        promotion_id: cart.promotion_id,
        promotion_type: cart.promotion_type,
        promotion_value: cart.promotion_value,

        voucher_code: cart.voucher_code,
        voucher_type: cart.voucher_type,
        voucher_value: cart.voucher_value,

        loyalty_points_used: cart.loyalty_points_used,

        draft_at: new Date(),
        created_by: new Types.ObjectId(loggedUser.id),
      },
      session,
    );

    // 4: Create order items
    const orderItems = cart.cart_items.map((item) => ({
      order_id: order._id,
      product_franchise_id: item.product_franchise_id,
      quantity: item.quantity,
      price_snapshot: item.product_cart_price,
      note: item.note,
      options_hash: item.options_hash,
      options: item.options,
      discount_amount: item.discount_amount,
      line_total: item.line_total,
      final_line_total: item.final_line_total,
    }));
    await this.orderItemQuery.createOrderItems(orderItems, session);

    // 5: Order Status Log
    await this.orderStatusLogger.logOrderStatus(
      {
        order_id: order._id,
        old_status: OrderStatus.DEFAULT,
        new_status: OrderStatus.DRAFT,
        changed_by_staff: loggedUser.type === UserType.USER ? new Types.ObjectId(loggedUser.id) : undefined,
        changed_by_customer: loggedUser.type === UserType.CUSTOMER ? new Types.ObjectId(loggedUser.id) : undefined,
      },
      session,
    );

    return order;
  }

  public async getOrderDetail(orderId: string) {
    const item = await this.orderRepo.getOrderDetail(new Types.ObjectId(orderId));

    if (!item) {
      throw new HttpException(HttpStatus.BadRequest, "Order not found");
    }

    return item;
  }

  public async getOrderDetailByCode(orderCode: string) {
    const item = await this.orderRepo.getOrderDetailByCode(orderCode);

    if (!item) {
      throw new HttpException(HttpStatus.BadRequest, "Order not found");
    }

    return item;
  }

  public async getOrderByCartId(cartId: string) {
    const item = await this.orderRepo.findByCartId(new Types.ObjectId(cartId));

    if (!item) {
      throw new HttpException(HttpStatus.BadRequest, "Order not found");
    }

    return item;
  }

  public async getOrdersByCustomerId(customerId: string, status?: OrderStatus) {
    return this.orderRepo.getOrdersByCustomerId(customerId, status);
  }

  public async getOrdersForStaff(franchiseId: string, status?: OrderStatus) {
    return this.orderRepo.getOrdersForStaff(franchiseId, status);
  }

  // External dependencies
  public async getById(id: string): Promise<IOrder | null> {
    return this.orderRepo.findById(id);
  }

  public async getByIdWithSession(id: string, session: ClientSession): Promise<IOrder | null> {
    return this.orderRepo.findByIdWithSession(id, session);
  }

  public async confirmOrder(
    id: Types.ObjectId,
    loggedUser: UserAuthPayload | CustomerAuthPayload,
    session?: ClientSession,
  ): Promise<boolean> {
    const order = await this.orderRepo.findByIdWithSession(String(id), session ?? undefined);

    if (!order) {
      throw new HttpException(HttpStatus.BadRequest, "Order not found");
    }

    if (order.status !== OrderStatus.DRAFT) {
      throw new HttpException(HttpStatus.BadRequest, "Order cannot be confirmed");
    }

    const updateOrder = await this.orderRepo.confirmOrder(id, session);
    if (!updateOrder) {
      throw new HttpException(HttpStatus.BadRequest, "Confirm order failed");
    }

    await this.orderStatusLogger.logOrderStatus(
      {
        order_id: order._id,
        old_status: OrderStatus.DRAFT,
        new_status: OrderStatus.CONFIRMED,
        changed_by_customer: loggedUser.type === UserType.CUSTOMER ? new Types.ObjectId(loggedUser.id) : undefined,
        changed_by_staff: loggedUser.type === UserType.USER ? new Types.ObjectId(loggedUser.id) : undefined,
      },
      session,
    );

    return true;
  }

  public async cancelOrder(
    id: Types.ObjectId,
    failed_reason: string,
    loggedUser: UserAuthPayload | CustomerAuthPayload,
    session?: ClientSession,
  ): Promise<boolean> {
    const order = await this.orderRepo.findByIdWithSession(String(id), session);

    if (!order) {
      throw new HttpException(HttpStatus.BadRequest, "Order not found");
    }

    if (order.status !== OrderStatus.CONFIRMED) {
      throw new HttpException(HttpStatus.BadRequest, "Order cannot be canceled");
    }

    const updateOrder = await this.orderRepo.cancelOrder(id, failed_reason, session);
    if (!updateOrder) {
      throw new HttpException(HttpStatus.BadRequest, "Cancel order failed");
    }

    await this.orderStatusLogger.logOrderStatus(
      {
        order_id: order._id,
        old_status: OrderStatus.CONFIRMED,
        new_status: OrderStatus.CANCELED,
        changed_by_customer: loggedUser.type === UserType.CUSTOMER ? new Types.ObjectId(loggedUser.id) : undefined,
        changed_by_staff: loggedUser.type === UserType.USER ? new Types.ObjectId(loggedUser.id) : undefined,
      },
      session,
    );

    return true;
  }

  public async markPreparingOrder(id: string, loggedUser: UserAuthPayload): Promise<boolean> {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // 1. Get order
      const order = await this.orderRepo.findByIdWithSession(id, session);

      if (!order) {
        throw new HttpException(HttpStatus.BadRequest, "Order not found");
      }

      if (order.status !== OrderStatus.CONFIRMED) {
        throw new HttpException(HttpStatus.BadRequest, `Invalid status transition. Current status: ${order.status}`);
      }

      // 2. Get order items
      const orderItems = await this.orderItemQuery.getItemsByOrderId(id, session);

      if (!orderItems || orderItems.length === 0) {
        throw new HttpException(HttpStatus.BadRequest, "Order items not found");
      }

      // 3. Deduct inventory
      for (const item of orderItems) {
        const ok = await this.inventoryQuery.deductProduct(String(item.product_franchise_id), item.quantity, session);

        if (!ok) {
          throw new HttpException(HttpStatus.BadRequest, "Not enough product stock");
        }

        for (const option of item.options || []) {
          const okOption = await this.inventoryQuery.deductProduct(
            String(option.product_franchise_id),
            option.quantity,
            session,
          );

          if (!okOption) {
            throw new HttpException(HttpStatus.BadRequest, "Not enough option stock");
          }
        }
      }

      // 4. Update status (atomic)
      const updated = await this.orderRepo.updateStatusOrder(id, OrderStatus.CONFIRMED, OrderStatus.PREPARING, session);

      if (!updated) {
        throw new HttpException(HttpStatus.BadRequest, "Update status failed");
      }

      await session.commitTransaction();

      // 5. Audit log
      await this.auditLogger.log({
        entityType: AuditEntityType.ORDER,
        entityId: id,
        action: AuditAction.ORDER_PREPARING,
        oldData: { status: OrderStatus.CONFIRMED },
        newData: { status: OrderStatus.PREPARING },
        changedBy: loggedUser.id,
      });
      return true;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  public async markReadyForPickupOrder(
    id: string,
    assignedTo: string, // shipper
    loggedUser: UserAuthPayload,
  ): Promise<boolean> {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // 1. Get order
      const order = await this.orderRepo.findByIdWithSession(id, session);

      if (!order) {
        throw new HttpException(HttpStatus.BadRequest, "Order not found");
      }

      if (order.status !== OrderStatus.PREPARING) {
        throw new HttpException(HttpStatus.BadRequest, `Invalid status transition. Current status: ${order.status}`);
      }

      // 2. Update order → READY_FOR_PICKUP (atomic)
      const updated = await this.orderRepo.updateStatusOrder(
        id,
        OrderStatus.PREPARING,
        OrderStatus.READY_FOR_PICKUP,
        session,
      );

      if (!updated) {
        throw new HttpException(HttpStatus.BadRequest, "Update status failed");
      }

      // 3. Create delivery
      await this.deliveryQuery.createDelivery(
        {
          order_id: order._id,
          customer_id: order.customer_id,
          assigned_by: new Types.ObjectId(loggedUser.id),
          assigned_to: new Types.ObjectId(assignedTo),
          status: DeliveryStatus.ASSIGNED,
          assigned_at: new Date(),
        },
        session,
      );

      await session.commitTransaction();

      // 4. Audit log
      await this.auditLogger.log({
        entityType: AuditEntityType.ORDER,
        entityId: id,
        action: AuditAction.ORDER_READY_FOR_PICKUP,
        oldData: { status: OrderStatus.PREPARING },
        newData: { status: OrderStatus.READY_FOR_PICKUP },
        changedBy: loggedUser.id,
      });
      return true;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
