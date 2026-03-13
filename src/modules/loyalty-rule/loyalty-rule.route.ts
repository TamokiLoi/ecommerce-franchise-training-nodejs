import { Router } from "express";
import {
  adminAuthMiddleware,
  API_PATH,
  IRoute,
  requireMoreContext,
  SYSTEM_AND_FRANCHISE_MANAGER_ROLES,
  validationMiddleware,
} from "../../core";
import CreateLoyaltyRuleDto from "./dto/create.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import { UpdateLoyaltyRuleDto } from "./dto/update.dto";
import { LoyaltyRuleController } from "./loyalty-rule.controller";

export default class LoyaltyRuleRoute implements IRoute {
  public path = API_PATH.LOYALTY_RULE;
  public router = Router();

  constructor(private readonly controller: LoyaltyRuleController) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * tags:
     *   - name: LoyaltyRule
     *     description: LoyaltyRule related endpoints
     */

    // POST domain:/api/loyalty-rules - Create item
    this.router.post(
      this.path,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(CreateLoyaltyRuleDto),
      this.controller.createItem,
    );

    // POST domain:/api/loyalty-rules/search - Get all items (pagination + filter)
    this.router.post(
      API_PATH.LOYALTY_RULE_SEARCH,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(SearchPaginationItemDto, true, {
        enableImplicitConversion: false,
      }),
      this.controller.getItems,
    );

    // GET domain:/api/loyalty-rules/:id - Get item by id
    this.router.get(
      API_PATH.LOYALTY_RULE_ID,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.getItem,
    );

    // PUT domain:/api/loyalty-rules/:id - Update item
    this.router.put(
      API_PATH.LOYALTY_RULE_ID,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(UpdateLoyaltyRuleDto),
      this.controller.updateItem,
    );
  }
}
