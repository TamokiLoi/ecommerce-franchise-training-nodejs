import { BaseModule } from "../../core/modules";
import { AuditLogModule } from "../audit-log";
import { PromotionController } from "./promotion.controller";
import { IPromotionQuery } from "./promotion.interface";
import { PromotionRepository } from "./promotion.repository";
import PromotionRoute from "./promotion.route";
import { PromotionService } from "./promotion.service";

export class PromotionModule extends BaseModule<PromotionRoute> {
  private readonly promotionQuery: IPromotionQuery;

  constructor() {
    super();

    const auditLogModule = new AuditLogModule();
    const repo = new PromotionRepository();

    const service = new PromotionService(repo, auditLogModule.getAuditLogger());
    const controller = new PromotionController(service);
    this.route = new PromotionRoute(controller);

    this.promotionQuery = service;
  }

  public getPromotionQuery(): IPromotionQuery {
    return this.promotionQuery;
  }
}
