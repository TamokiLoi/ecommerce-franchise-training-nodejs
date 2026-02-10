import { BaseModule } from "../../core/modules";
import { AuditLogModule } from "../audit-log";
import { CategoryController } from "./category.controller";
import { ICategoryQuery } from "./category.interface";
import { CategoryRepository } from "./category.repository";
import CategoryRoute from "./category.route";
import { CategoryService } from "./category.service";

export class CategoryModule extends BaseModule<CategoryRoute> {
  private readonly categoryQuery: ICategoryQuery;

  constructor() {
    super();

    // Internal dependencies
    const auditLogModule = new AuditLogModule();
    const repo = new CategoryRepository();

    // Core service and HTTP layer
    const service = new CategoryService(repo, auditLogModule.getAuditLogger());
    const controller = new CategoryController(service);
    this.route = new CategoryRoute(controller);

    this.categoryQuery = service;
  }

  public getCategoryQuery(): ICategoryQuery {
    return this.categoryQuery;
  }
}
