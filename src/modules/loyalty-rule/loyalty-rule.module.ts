import { BaseModule } from "../../core";
import { AuditLogModule } from "../audit-log";
import { LoyaltyRuleController } from "./loyalty-rule.controller";
import { ILoyaltyRuleQuery } from "./loyalty-rule.interface";
import { LoyaltyRuleRepository } from "./loyalty-rule.repository";
import LoyaltyRuleRoute from "./loyalty-rule.route";
import { LoyaltyRuleService } from "./loyalty-rule.service";

export class LoyaltyRuleModule extends BaseModule<LoyaltyRuleRoute> {
  private readonly loyaltyRuleQuery: ILoyaltyRuleQuery;

  constructor() {
    super();

    // Internal dependencies
    const auditLogModule = new AuditLogModule();
    const auditLogger = auditLogModule.getAuditLogger();
    const repo = new LoyaltyRuleRepository();

    // Core service and HTTP layer
    const service = new LoyaltyRuleService(repo, auditLogger);
    const controller = new LoyaltyRuleController(service);
    this.route = new LoyaltyRuleRoute(controller);

    this.loyaltyRuleQuery = service;
  }

  public getLoyaltyRuleQuery(): ILoyaltyRuleQuery {
    return this.loyaltyRuleQuery;
  }
}
