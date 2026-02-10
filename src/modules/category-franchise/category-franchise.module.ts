import { BaseModule } from "../../core/modules";
import { AuditLogModule } from "../audit-log";
import { CategoryModule } from "../category";
import { FranchiseModule } from "../franchise";
import { CategoryFranchiseController } from "./category-franchise.controller";
import { CategoryFranchiseRepository } from "./category-franchise.repository";
import CategoryFranchiseRoute from "./category-franchise.route";
import { CategoryFranchiseService } from "./category-franchise.service";

export class CategoryFranchiseModule extends BaseModule<CategoryFranchiseRoute> {
  constructor(categoryModule: CategoryModule, franchiseModule: FranchiseModule) {
    super();

    // ===== External dependencies (query only) =====
    const categoryQuery = categoryModule.getCategoryQuery();
    const franchiseQuery = franchiseModule.getFranchiseQuery();

    // ===== Internal dependencies =====
    const auditLogModule = new AuditLogModule();
    const repo = new CategoryFranchiseRepository();

    // Core service and HTTP layer
    const service = new CategoryFranchiseService(repo, categoryQuery, franchiseQuery, auditLogModule.getAuditLogger());
    const controller = new CategoryFranchiseController(service);
    this.route = new CategoryFranchiseRoute(controller);
  }
}
