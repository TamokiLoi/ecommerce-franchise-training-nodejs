import { ICartItem, ICartItemQuery } from "./cart-item.interface";
import { CartItemRepository } from "./cart-item.repository";
import { ICreateCartItemDto } from "./dto/create.dto";
import { ICartItemDto } from "./dto/item.dto";

export class CartItemService implements ICartItemQuery {
  private readonly cartItemRepo: CartItemRepository;

  constructor(repo: CartItemRepository) {
    this.cartItemRepo = repo;
  }

  public async getCartItem(payload: ICartItemDto): Promise<ICartItem | null> {
    return this.cartItemRepo.findOne({
      cart_id: payload.cart_id,
      product_franchise_id: payload.product_franchise_id,
      options_hash: payload.options_hash,
    });
  }

  public async createCartItem(payload: ICreateCartItemDto): Promise<ICartItem> {
    // TODO: create auditLogger
    return this.cartItemRepo.create(payload);
  }
}
