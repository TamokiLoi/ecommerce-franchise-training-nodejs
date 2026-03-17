import { ClientSession, Types } from "mongoose";
import { BaseRepository } from "../../core";
import { IOrderItem } from "./order-item.interface";
import OrderItemSchema from "./order-item.model";

export class OrderItemRepository extends BaseRepository<IOrderItem> {
  constructor() {
    super(OrderItemSchema);
  }

  public async createMany(payload: Partial<IOrderItem>[], session?: ClientSession): Promise<IOrderItem[]> {
    return this.model.insertMany(payload, { session });
  }

  public async getItemsByOrderId(orderId: string, session?: ClientSession): Promise<IOrderItem[]> {
    const query = this.model.find({
      orderId: new Types.ObjectId(orderId),
      is_deleted: false,
    });

    if (session) {
      query.session(session);
    }

    return query;
  }
}
