import { Types } from "mongoose";
import { BaseRepository } from "../../core";
import { ICartItem } from "./cart-item.interface";
import CartItemSchema from "./cart-item.model";

export class CartItemRepository extends BaseRepository<ICartItem> {
  constructor() {
    super(CartItemSchema);
  }

  public async getItemsByCartId(cartId: Types.ObjectId): Promise<ICartItem[]> {
    return this.model.find({
      cart_id: cartId,
      is_deleted: false,
    });
  }
}
