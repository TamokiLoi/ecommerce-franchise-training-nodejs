import { BaseModule } from "../../core";
import { AuditLogModule } from "../audit-log";
import { CartItemController } from "./cart-item.controller";
import { ICartItemQuery } from "./cart-item.interface";
import { CartItemRepository } from "./cart-item.repository";
import CartItemRoute from "./cart-item.route";
import { CartItemService } from "./cart-item.service";

export class CartItemModule extends BaseModule<CartItemRoute> {
  private readonly cartItemQuery: ICartItemQuery;

  constructor() {
    super();

    // ===== Internal dependencies =====
    const auditLogModule = new AuditLogModule();
    const auditLogger = auditLogModule.getAuditLogger();
    const repo = new CartItemRepository();

    // Core service and Http layer
    const service = new CartItemService(repo, auditLogger);
    const controller = new CartItemController();
    this.route = new CartItemRoute(controller);

    this.cartItemQuery = service;
  }

  public getCartItemQuery(): ICartItemQuery {
    return this.cartItemQuery;
  }
}
