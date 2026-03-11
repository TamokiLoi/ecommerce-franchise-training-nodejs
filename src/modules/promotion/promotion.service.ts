import { Types } from "mongoose";
import { MSG_BUSINESS } from "../../core";
import { BaseFieldName, HttpStatus } from "../../core/enums";
import { HttpException } from "../../core/exceptions";
import { IError } from "../../core/interfaces";
import { BaseCrudService } from "../../core/services";
import { checkEmptyObject, normalizeText } from "../../core/utils";
import { AuditAction, AuditEntityType, buildAuditDiff, IAuditLogger, pickAuditSnapshot } from "../audit-log";
import { IProductFranchiseQuery } from "../product-franchise";
import { CreatePromotionDto } from "./dto/create.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import { UpdatePromotionDto } from "./dto/update.dto";
import { PromotionFieldName } from "./promotion.enum";
import { IPromotion } from "./promotion.interface";
import { PromotionRepository } from "./promotion.repository";

const AUDIT_FIELDS_ITEM = [
  BaseFieldName.FRANCHISE_ID,
  PromotionFieldName.PRODUCT_FRANCHISE_ID,
  PromotionFieldName.TYPE,
  PromotionFieldName.VALUE,
  PromotionFieldName.START_DATE,
  PromotionFieldName.END_DATE,
] as readonly (keyof IPromotion)[];

export class PromotionService extends BaseCrudService<
  IPromotion,
  CreatePromotionDto,
  UpdatePromotionDto,
  SearchPaginationItemDto
> {
  private readonly promotionRepo: PromotionRepository;

  constructor(
    repo: PromotionRepository,
    private readonly auditLogger: IAuditLogger,
    private readonly productFranchiseQuery: IProductFranchiseQuery,
  ) {
    super(repo);
    this.promotionRepo = repo;
  }

  protected async beforeCreate(dto: CreatePromotionDto, loggedUserId: string): Promise<void> {
    await checkEmptyObject(dto);

    const errors: IError[] = [];

    const normalizedName = normalizeText(dto.name);
    // We need to check name uniqueness within the same franchise
    const isExist = await this.repo.existsByFilter({
      [BaseFieldName.NAME]: normalizedName,
      [BaseFieldName.FRANCHISE_ID]: new Types.ObjectId(dto.franchise_id),
    });
    if (isExist) {
      errors.push({
        field: BaseFieldName.NAME,
        message: MSG_BUSINESS.ITEM_EXISTS(`Promotion with Name: '${dto.name}' in this franchise`),
      });
    }

    if (dto.product_franchise_id) {
      const productFranchise = await this.productFranchiseQuery.getById(dto.product_franchise_id);

      if (!productFranchise) {
        errors.push({
          field: BaseFieldName.PRODUCT_FRANCHISE_ID,
          message: "Product franchise not found",
        });
      } else if (productFranchise.franchise_id.toString() !== dto.franchise_id) {
        errors.push({
          field: BaseFieldName.PRODUCT_FRANCHISE_ID,
          message: "Product franchise does not belong to franchise",
        });
      }
    }

    if (dto.start_date >= dto.end_date) {
      errors.push({
        field: PromotionFieldName.START_DATE,
        message: "Start date must be before End date",
      });
    }

    if (dto.start_date < new Date()) {
      errors.push({
        field: PromotionFieldName.START_DATE,
        message: "Start date must be in the future",
      });
    }

    dto.created_by = loggedUserId;

    if (errors.length) {
      throw new HttpException(HttpStatus.BadRequest, "", errors);
    }
  }

  protected async afterCreate(item: IPromotion, loggedUserId: string): Promise<void> {
    const snapshot = pickAuditSnapshot(item, AUDIT_FIELDS_ITEM);

    await this.auditLogger.log({
      entityType: AuditEntityType.PROMOTION,
      entityId: String(item._id),
      action: AuditAction.CREATE,
      newData: snapshot,
      changedBy: loggedUserId,
    });
  }

  protected async beforeUpdate(current: IPromotion, payload: UpdatePromotionDto, loggedUserId: string): Promise<void> {
    await checkEmptyObject(payload);

    const errors: IError[] = [];

    // Check unique name in franchise if name is being updated
    if (payload.name && payload.name !== current.name) {
      const normalizedName = normalizeText(payload.name);
      // We need to check name uniqueness within the same franchise
      const isExist = await this.repo.existsByFilter({
        [BaseFieldName.NAME]: normalizedName,
        [BaseFieldName.FRANCHISE_ID]: new Types.ObjectId(current.franchise_id.toString()),
        _id: { $ne: current._id },
      });
      if (isExist) {
        errors.push({
          field: BaseFieldName.NAME,
          message: MSG_BUSINESS.ITEM_EXISTS(`Promotion with Name: '${payload.name}' in this franchise`),
        });
      }
    }

    const start = payload.start_date ?? current.start_date;
    const end = payload.end_date ?? current.end_date;

    if (start >= end) {
      errors.push({
        field: PromotionFieldName.START_DATE,
        message: "start date must be before end date",
      });
    }

    if (start < new Date()) {
      errors.push({
        field: PromotionFieldName.START_DATE,
        message: "Start date must be in the future",
      });
    }

    if (errors.length) {
      throw new HttpException(HttpStatus.BadRequest, "", errors);
    }
  }

  protected async afterUpdate(oldItem: IPromotion, newItem: IPromotion, loggedUserId: string): Promise<void> {
    const { oldData, newData } = buildAuditDiff(oldItem, newItem, AUDIT_FIELDS_ITEM);

    if (newData && Object.keys(newData).length > 0) {
      await this.auditLogger.log({
        entityType: AuditEntityType.PROMOTION,
        entityId: String(oldItem._id),
        action: AuditAction.UPDATE,
        oldData,
        newData,
        changedBy: loggedUserId,
      });
    }
  }

  protected async afterDelete(item: IPromotion, loggedUserId: string): Promise<void> {
    await this.auditLogger.log({
      entityType: AuditEntityType.PROMOTION,
      entityId: String(item._id),
      action: AuditAction.SOFT_DELETE,
      oldData: { is_deleted: false },
      newData: { is_deleted: true },
      changedBy: loggedUserId,
    });
  }

  protected async afterRestore(item: IPromotion, loggedUserId: string): Promise<void> {
    await this.auditLogger.log({
      entityType: AuditEntityType.PROMOTION,
      entityId: String(item._id),
      action: AuditAction.RESTORE,
      oldData: { is_deleted: true },
      newData: { is_deleted: false },
      changedBy: loggedUserId,
    });
  }

  protected async doSearch(dto: SearchPaginationItemDto): Promise<{ data: IPromotion[]; total: number }> {
    return (this.repo as PromotionRepository).getItems(dto);
  }

  public async getById(id: string): Promise<IPromotion | null> {
    return this.promotionRepo.getItem(id);
  }

  public async getDetail(id: string): Promise<IPromotion | null> {
    const item = this.promotionRepo.getItem(id);

    if (!item) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.ITEM_NOT_FOUND);
    }

    return item;
  }

  public async changeStatus(id: string, is_active: boolean, loggedUserId: string): Promise<IPromotion | null> {
    const item = await this.repo.findById(id);

    if (!item) {
      throw new HttpException(HttpStatus.NotFound, "Promotion not found");
    }

    const updated = await this.repo.update(id, {
      is_active,
    });

    await this.auditLogger.log({
      entityType: AuditEntityType.PROMOTION,
      entityId: id,
      action: AuditAction.UPDATE,
      oldData: { is_active: item.is_active },
      newData: { is_active },
      changedBy: loggedUserId,
    });

    return updated;
  }

  public async getAllPromotionsByFranchiseId(franchiseId: string) {
    return this.repo.find({
      franchise_id: franchiseId,
      is_deleted: false,
    });
  }

  public async getAllPromotionsByProductFranchiseId(productFranchiseId: string) {
    return this.repo.find({
      product_franchise_id: productFranchiseId,
      is_deleted: false,
    });
  }
}
