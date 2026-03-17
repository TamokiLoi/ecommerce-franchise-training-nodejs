import { ClientSession } from "mongoose";
import { IAuditLogger } from "../audit-log";
import { ICreateOrderItemDto } from "./dto/create.dto";
import { IOrderItem, IOrderItemQuery } from "./order-item.interface";
import { OrderItemRepository } from "./order-item.repository";

export class OrderItemService implements IOrderItemQuery {
  private readonly orderItemRepo: OrderItemRepository;

  constructor(
    repo: OrderItemRepository,
    private readonly auditLogger: IAuditLogger,
  ) {
    this.orderItemRepo = repo;
  }

  public async createOderItem(payload: ICreateOrderItemDto): Promise<IOrderItem> {
    // TODO: create auditLogger
    return this.orderItemRepo.create(payload);
  }

  public async createOrderItems(payload: ICreateOrderItemDto[], session?: ClientSession): Promise<IOrderItem[]> {
    if (!payload.length) {
      throw new Error("Order items cannot be empty");
    }

    return this.orderItemRepo.createMany(payload, session);
  }

  public async getById(id: string): Promise<IOrderItem | null> {
    return this.orderItemRepo.findById(id);
  }

  public async getItemsByOrderId(orderId: string, session?: ClientSession): Promise<IOrderItem[]> {
    return this.orderItemRepo.getItemsByOrderId(orderId, session);
  }
}
