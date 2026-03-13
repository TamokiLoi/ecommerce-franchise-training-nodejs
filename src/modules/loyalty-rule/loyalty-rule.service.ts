import { BaseCrudService, BaseFieldName, HttpException, HttpStatus, IError } from "../../core";
import { AuditAction, AuditEntityType, buildAuditDiff, IAuditLogger, pickAuditSnapshot } from "../audit-log";
import CreateLoyaltyRuleDto from "./dto/create.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import { UpdateLoyaltyRuleDto } from "./dto/update.dto";
import { ILoyaltyRule, ILoyaltyRuleQuery } from "./loyalty-rule.interface";
import { LoyaltyRuleRepository } from "./loyalty-rule.repository";

export const AUDIT_FIELDS_ITEM = [
  BaseFieldName.EARN_AMOUNT_PER_POINT,
  BaseFieldName.REDEEM_VALUE_PER_POINT,
  BaseFieldName.MIN_REDEEM_POINTS,
  BaseFieldName.MAX_REDEEM_POINTS,
  BaseFieldName.TIER_RULES,
  BaseFieldName.DESCRIPTION,
] as readonly (keyof ILoyaltyRule)[];

export class LoyaltyRuleService
  extends BaseCrudService<ILoyaltyRule, CreateLoyaltyRuleDto, UpdateLoyaltyRuleDto, SearchPaginationItemDto>
  implements ILoyaltyRuleQuery
{
  private readonly loyaltyRuleRepo: LoyaltyRuleRepository;

  constructor(
    repo: LoyaltyRuleRepository,
    private readonly auditLogger: IAuditLogger,
  ) {
    super(repo);
    this.loyaltyRuleRepo = repo;
  }

  // ===== Start CRUD =====
  protected async beforeCreate(dto: CreateLoyaltyRuleDto, loggedUserId: string): Promise<void> {
    const errors: IError[] = [];

    // 1. Prevent duplicate
    const existed = await this.loyaltyRuleRepo.getByFranchiseId(dto.franchise_id);
    if (existed) {
      throw new HttpException(HttpStatus.BadRequest, "Loyalty rule already exists");
    }

    // 2. Validate tier rules
    if (dto.max_redeem_points && dto.min_redeem_points > dto.max_redeem_points) {
      errors.push({
        field: BaseFieldName.MIN_REDEEM_POINTS,
        message: "Min redeem points must be <= Max redeem points",
      });
    }

    // 3. Validate tier rules
    if (!dto.tier_rules || dto.tier_rules.length === 0) {
      throw new HttpException(HttpStatus.BadRequest, "Tier rules is required");
    }

    const sorted = [...dto.tier_rules].sort((a, b) => a.min_points - b.min_points);
    const tierSet = new Set();
    for (let i = 0; i < sorted.length; i++) {
      const rule = sorted[i];

      if (tierSet.has(rule.tier)) {
        throw new HttpException(HttpStatus.BadRequest, `Duplicate tier ${rule.tier}`);
      }

      tierSet.add(rule.tier);

      if (i > 0) {
        const prev = sorted[i - 1];

        if (prev.max_points && rule.min_points <= prev.max_points) {
          throw new HttpException(
            HttpStatus.BadRequest,
            `Tier ${rule.tier} Min points must be greater than tier ${prev.tier} Max points`,
          );
        }
      }

      if (i < sorted.length - 1 && !rule.max_points) {
        throw new HttpException(HttpStatus.BadRequest, "Only last tier can have null Max points");
      }
    }

    if (errors.length) {
      throw new HttpException(HttpStatus.BadRequest, "", errors);
    }
  }

  protected async afterCreate(item: ILoyaltyRule, loggedUserId: string): Promise<void> {
    const snapshot = pickAuditSnapshot(item, AUDIT_FIELDS_ITEM);
    await this.auditLogger.log({
      entityType: AuditEntityType.LOYALTY_RULE,
      entityId: String(item._id),
      action: AuditAction.CREATE,
      newData: snapshot,
      changedBy: loggedUserId,
    });
  }

  protected async beforeUpdate(current: ILoyaltyRule, dto: UpdateLoyaltyRuleDto, loggedUserId: string): Promise<void> {
    const errors: IError[] = [];
    /**
     * 1. validate redeem range
     */
    const minRedeem = dto.min_redeem_points ?? current.min_redeem_points;
    const maxRedeem = dto.max_redeem_points ?? current.max_redeem_points;
    if (maxRedeem && minRedeem > maxRedeem) {
      errors.push({
        field: BaseFieldName.MIN_REDEEM_POINTS,
        message: "Min redeem points must be <= Max redeem points",
      });
    }

    /**
     * 2. validate tier rules
     */
    if (dto.tier_rules) {
      if (!dto.tier_rules.length) {
        throw new HttpException(HttpStatus.BadRequest, "Tier rules cannot be empty");
      }

      const sorted = [...dto.tier_rules].sort((a, b) => a.min_points - b.min_points);
      const tierSet = new Set();
      for (let i = 0; i < sorted.length; i++) {
        const rule = sorted[i];

        /**
         * duplicate tier
         */
        if (tierSet.has(rule.tier)) {
          throw new HttpException(HttpStatus.BadRequest, `Duplicate tier ${rule.tier}`);
        }

        tierSet.add(rule.tier);

        /**
         * overlap check
         */
        if (i > 0) {
          const prev = sorted[i - 1];

          if (prev.max_points && rule.min_points <= prev.max_points) {
            throw new HttpException(
              HttpStatus.BadRequest,
              `Tier ${rule.tier} Min points must be greater than tier ${prev.tier} Max points`,
            );
          }
        }

        /**
         * only last tier can have null max_points
         */
        if (i < sorted.length - 1 && !rule.max_points) {
          throw new HttpException(HttpStatus.BadRequest, "Only last tier can have null Max points");
        }
      }
    }

    if (errors.length) {
      throw new HttpException(HttpStatus.BadRequest, "", errors);
    }
  }

  protected async afterUpdate(oldItem: ILoyaltyRule, newItem: ILoyaltyRule, loggedUserId: string): Promise<void> {
    const { oldData, newData } = buildAuditDiff(oldItem, newItem, AUDIT_FIELDS_ITEM);

    if (newData && Object.keys(newData).length > 0) {
      await this.auditLogger.log({
        entityType: AuditEntityType.LOYALTY_RULE,
        entityId: String(oldItem._id),
        action: AuditAction.UPDATE,
        oldData,
        newData,
        changedBy: loggedUserId,
      });
    }
  }

  protected async doSearch(dto: SearchPaginationItemDto): Promise<{ data: ILoyaltyRule[]; total: number }> {
    return this.loyaltyRuleRepo.getItems(dto);
  }

  // ===== END CRUD =====

  public async getById(id: string): Promise<ILoyaltyRule | null> {
    return this.loyaltyRuleRepo.findById(id);
  }

  public async getRoyaltyRuleByFranchiseId(franchiseId: string): Promise<ILoyaltyRule> {
    const item = await this.loyaltyRuleRepo.getByFranchiseId(franchiseId);
    if (!item) {
      throw new HttpException(HttpStatus.BadRequest, "Loyalty rule not found");
    }
    return item;
  }
}
