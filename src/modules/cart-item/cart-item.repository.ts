import { BaseRepository } from "../../core";
import { ICartItem } from "./cart-item.interface";
import CartItemSchema from "./cart-item.model";

export class CartItemRepository extends BaseRepository<ICartItem> {
  constructor() {
    super(CartItemSchema);
  }
}
