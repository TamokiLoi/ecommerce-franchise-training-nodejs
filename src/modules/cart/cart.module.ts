import { BaseModule } from "../../core";
import { AuditLogModule } from "../audit-log";
import { CartItemModule } from "../cart-item";
import { CustomerModule } from "../customer";
import { FranchiseModule } from "../franchise";
import { ProductFranchiseModule } from "../product-franchise";
import { CartItemService } from "./cart-item.service";
import { CartOptionItemService } from "./cart-option-item.service";
import { CartController } from "./cart.controller";
import { CartHelper } from "./cart.helper";
import { CartRepository } from "./cart.repository";
import CartRoute from "./cart.route";
import { CartService } from "./cart.service";

export class CartModule extends BaseModule<CartRoute> {
  constructor(
    customerModule: CustomerModule,
    franchiseModule: FranchiseModule,
    productFranchiseModule: ProductFranchiseModule,
    cartItemModule: CartItemModule,
  ) {
    super();

    // ===== External dependencies =====
    const customerQuery = customerModule.getCustomerQuery();
    const franchiseQuery = franchiseModule.getFranchiseQuery();
    const productFranchiseQuery = productFranchiseModule.getProductFranchiseQuery();
    const cartItemQuery = cartItemModule.getCartItemQuery();

    // ===== Internal dependencies =====
    const auditLogModule = new AuditLogModule();
    const auditLogger = auditLogModule.getAuditLogger();
    const repo = new CartRepository();
    const cartHelper = new CartHelper(productFranchiseQuery);
    const cartItemService = new CartItemService(auditLogger, cartHelper, cartItemQuery);
    const cartItemOptionService = new CartOptionItemService(auditLogger, cartHelper, cartItemQuery);

    // Core service and Http layer
    const service = new CartService(
      repo,
      auditLogger,
      cartHelper,
      cartItemService,
      cartItemOptionService,
      customerQuery,
      franchiseQuery,
      productFranchiseQuery,
      cartItemQuery,
    );

    const controller = new CartController(service);
    this.route = new CartRoute(controller);
  }
}
