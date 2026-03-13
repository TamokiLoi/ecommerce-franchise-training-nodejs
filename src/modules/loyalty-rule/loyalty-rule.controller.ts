import { BaseCrudController } from "../../core";
import CreateLoyaltyRuleDto from "./dto/create.dto";
import { LoyaltyRuleItemDto } from "./dto/item.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import { UpdateLoyaltyRuleDto } from "./dto/update.dto";
import { ILoyaltyRule } from "./loyalty-rule.interface";
import { mapItemToResponse } from "./loyalty-rule.mapper";
import { LoyaltyRuleService } from "./loyalty-rule.service";

export class LoyaltyRuleController extends BaseCrudController<
  ILoyaltyRule,
  CreateLoyaltyRuleDto,
  UpdateLoyaltyRuleDto,
  SearchPaginationItemDto,
  LoyaltyRuleItemDto,
  LoyaltyRuleService
> {
  constructor(service: LoyaltyRuleService) {
    super(service, mapItemToResponse);
  }
}
