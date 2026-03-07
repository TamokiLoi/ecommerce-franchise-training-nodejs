import { CustomerAuthPayload, UserAuthPayload } from "../../core";
import { AuditAction, AuditEntityType, IAuditLogger } from "../audit-log";
import { ICartItemQuery } from "../cart-item";
import { CartHelper } from "./cart.helper";

export class CartItemService {
  constructor(
    private readonly auditLogger: IAuditLogger,
    private readonly cartHelper: CartHelper,
    private readonly cartItemQuery: ICartItemQuery,
  ) {}

  public async removeCartItem(cartItemId: string, loggedUser: UserAuthPayload | CustomerAuthPayload): Promise<void> {
    const item = await this.cartItemQuery.findByIdForUpdate(cartItemId);
    if (!item) throw new Error("Cart item not found");
    const oldSnapshot = this.cartHelper.buildCartItemSnapshot(item);
    await item.deleteOne();
    await this.auditLogger.log({
      entityType: AuditEntityType.CART,
      entityId: cartItemId,
      action: AuditAction.REMOVE_CART_ITEM,
      oldData: oldSnapshot,
      newData: undefined,
      changedBy: loggedUser.id,
    });
  }
}
