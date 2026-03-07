import { Types } from "mongoose";
import { IAuditLogger } from "../audit-log";
import { ICartItem, ICartItemQuery } from "./cart-item.interface";
import { CartItemRepository } from "./cart-item.repository";
import { ICreateCartItemDto } from "./dto/create.dto";
import { ICartItemDto } from "./dto/item.dto";

export class CartItemService implements ICartItemQuery {
  private readonly cartItemRepo: CartItemRepository;

  constructor(
    repo: CartItemRepository,
    private readonly auditLogger: IAuditLogger,
  ) {
    this.cartItemRepo = repo;
  }

  public async getById(id: string): Promise<ICartItem | null> {
    return this.cartItemRepo.findById(id);
  }

  public async findByIdForUpdate(id: string): Promise<ICartItem | null> {
    return this.cartItemRepo.findByIdForUpdate(id);
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

  public async findDuplicateCartItem(payload: {
    cart_id: Types.ObjectId;
    product_franchise_id: Types.ObjectId;
    options_hash: string;
    exclude_id: Types.ObjectId;
  }): Promise<ICartItem | null> {
    const { cart_id, product_franchise_id, options_hash, exclude_id } = payload;

    return this.cartItemRepo.findOne({
      cart_id,
      product_franchise_id,
      options_hash,
      _id: { $ne: exclude_id },
    });
  }
}
