import { BaseModule } from "../../core";
import { AuditLogModule } from "../audit-log";
import { ProductModule } from "../product";
import { ProductFranchiseModule } from "../product-franchise";
import { InventoryLogRepository } from "./inventory-log.repository";
import InventoryController from "./inventory.controller";
import { IInventoryQuery } from "./inventory.interface";
import { InventoryRepository } from "./inventory.repository";
import InventoryRoute from "./inventory.route";
import { InventoryService } from "./inventory.service";

export class InventoryModule extends BaseModule<InventoryRoute> {
  private readonly inventoryQuery: IInventoryQuery;

  constructor(productModule: ProductModule, productFranchiseModule: ProductFranchiseModule) {
    super();

    // ===== External dependencies (query only) =====
    const productQuery = productModule.getProductQuery();
    const productFranchiseQuery = productFranchiseModule.getProductFranchiseQuery();

    // ===== Internal dependencies =====
    const auditLogModule = new AuditLogModule();

    const inventoryRepo = new InventoryRepository();
    const inventoryLogRepo = new InventoryLogRepository();

    // ===== Core service =====
    const service = new InventoryService(
      inventoryRepo,
      inventoryLogRepo,
      auditLogModule.getAuditLogger(),
      productQuery,
      productFranchiseQuery,
    );

    // ===== HTTP layer =====
    const controller = new InventoryController(service);
    this.route = new InventoryRoute(controller);

    this.inventoryQuery = service;
  }

  public getInventoryQuery(): IInventoryQuery {
    return this.inventoryQuery;
  }
}
