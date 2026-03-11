import { CustomerAuthPayload, HttpException, HttpStatus, UserAuthPayload } from "../../core";
import { AuditAction, AuditEntityType, IAuditLogger } from "../audit-log";
import { ICartItem, ICartItemQuery } from "../cart-item";
import { CartHelper } from "./cart.helper";
import { AddCartItemOptionDto } from "./dto/create.dto";
import { RemoveOptionItemDto, UpdateQuantityOptionItemDto } from "./dto/optionItem.dto";

export class CartOptionItemService {
  constructor(
    private readonly auditLogger: IAuditLogger,
    private readonly cartHelper: CartHelper,
    private readonly cartItemQuery: ICartItemQuery,
  ) {}

  public async updateOptionItem(
    payload: UpdateQuantityOptionItemDto,
    loggedUser: UserAuthPayload | CustomerAuthPayload,
  ): Promise<ICartItem> {
    const { cart_item_id, option_product_franchise_id, quantity } = payload;

    /**
     * STEP 1 — Validate quantity
     */
    if (quantity < 0) {
      throw new HttpException(HttpStatus.BadRequest, "Quantity must be >= 0");
    }

    /**
     * STEP 2 — Get cart item
     */
    const item = await this.cartItemQuery.findByIdForUpdate(cart_item_id);

    if (!item) {
      throw new HttpException(HttpStatus.BadRequest, "Cart item not found");
    }

    /**
     * STEP 3 — Check option exists
     */
    const optionExists = item.options.some((o) => String(o.product_franchise_id) === option_product_franchise_id);

    if (!optionExists) {
      throw new HttpException(HttpStatus.BadRequest, "Option item does not exist in this cart item");
    }

    /**
     * STEP 4 — Snapshot before update
     */
    const oldSnapshot = this.cartHelper.buildCartItemSnapshot(item);

    /**
     * STEP 5 — Build new options
     */
    const newOptions = item.options
      .map((o) => {
        if (String(o.product_franchise_id) === option_product_franchise_id) {
          return {
            ...o,
            quantity,
          };
        }

        return o;
      })
      .filter((o) => o.quantity > 0); // remove option nếu quantity = 0

    /**
     * STEP 6 — Build options hash
     */
    const optionDtos: AddCartItemOptionDto[] = newOptions.map((o) => ({
      product_franchise_id: String(o.product_franchise_id),
      quantity: o.quantity,
    }));

    const { optionsHash } = this.cartHelper.buildOptionsHash(optionDtos);

    /**
     * STEP 7 — Check duplicate cart item (không phải chính nó)
     */
    const duplicateItem = await this.cartItemQuery.findDuplicateCartItem({
      cart_id: item.cart_id,
      product_franchise_id: item.product_franchise_id,
      options_hash: optionsHash,
      exclude_id: item._id,
    });

    let finalItem = item;

    /**
     * STEP 8 — Merge nếu duplicate tồn tại
     */
    if (duplicateItem) {
      duplicateItem.quantity += item.quantity;

      await duplicateItem.save();

      await item.deleteOne();

      finalItem = duplicateItem;
    } else {
      /**
       * Update item hiện tại
       */
      item.options = newOptions;
      item.options_hash = optionsHash;

      await item.save();

      finalItem = item;
    }

    /**
     * STEP 9 — Snapshot after update
     */
    const newSnapshot = this.cartHelper.buildCartItemSnapshot(finalItem);

    /**
     * STEP 10 — Audit log
     */
    await this.auditLogger.log({
      entityType: AuditEntityType.CART,
      entityId: String(finalItem._id),
      action: AuditAction.UPDATE_OPTION_ITEM,
      oldData: oldSnapshot,
      newData: newSnapshot,
      changedBy: loggedUser.id,
    });

    return finalItem;
  }

  public async removeOptionItem(
    payload: RemoveOptionItemDto,
    loggedUser: UserAuthPayload | CustomerAuthPayload,
  ): Promise<ICartItem> {
    const { cart_item_id, option_product_franchise_id } = payload;

    const item = await this.cartItemQuery.findByIdForUpdate(cart_item_id);
    if (!item) throw new Error("Cart item not found");

    const optionExists = item.options.some((o) => o.product_franchise_id.toString() === option_product_franchise_id);

    if (!optionExists) {
      throw new HttpException(HttpStatus.BadRequest, "Option item does not exist in this cart item");
    }

    const oldSnapshot = this.cartHelper.buildCartItemSnapshot(item);

    const newOptions = item.options.filter((o) => o.product_franchise_id.toString() !== option_product_franchise_id);

    const optionDtos: AddCartItemOptionDto[] = newOptions.map((o) => ({
      product_franchise_id: o.product_franchise_id.toString(),
      quantity: o.quantity,
    }));

    const { optionsHash } = this.cartHelper.buildOptionsHash(optionDtos);

    const existingItem = await this.cartItemQuery.getCartItem({
      cart_id: item.cart_id,
      product_franchise_id: item.product_franchise_id,
      options_hash: optionsHash,
    });

    // FIX: tránh merge với chính item hiện tại
    if (existingItem && existingItem._id.toString() !== item._id.toString()) {
      existingItem.quantity += item.quantity;
      await existingItem.save();

      await item.deleteOne();
    } else {
      item.options = newOptions;
      item.options_hash = optionsHash;

      await item.save();
    }

    const newSnapshot = this.cartHelper.buildCartItemSnapshot(item);

    await this.auditLogger.log({
      entityType: AuditEntityType.CART,
      entityId: String(item._id),
      action: AuditAction.REMOVE_OPTION_ITEM,
      oldData: oldSnapshot,
      newData: newSnapshot,
      changedBy: loggedUser.id,
    });

    return item;
  }
}
