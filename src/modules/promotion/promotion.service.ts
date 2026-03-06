import mongoose from "mongoose";
import { BaseFieldName, HttpStatus } from "../../core/enums";
import { HttpException } from "../../core/exceptions";
import { IError } from "../../core/interfaces";
import { BaseCrudService } from "../../core/services";
import { checkEmptyObject } from "../../core/utils";
import {
  AuditAction,
  AuditEntityType,
  buildAuditDiff,
  IAuditLogger,
  pickAuditSnapshot,
} from "../audit-log";
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
  constructor(
    repo: PromotionRepository,
    private readonly auditLogger: IAuditLogger,
  ) {
    super(repo);
  }

  protected async beforeCreate(
    dto: CreatePromotionDto,
    loggedUserId: string,
  ): Promise<void> {
    await checkEmptyObject(dto);

    const errors: IError[] = [];

    // kt franchise id valid
    if (!mongoose.isValidObjectId(dto.franchise_id)) {
      errors.push({
        field: BaseFieldName.FRANCHISE_ID,
        message: "Invalid franchise_id",
      });
    }

    // kt product franchise id
    if (!mongoose.isValidObjectId(dto.product_franchise_id)) {
      errors.push({
        field: PromotionFieldName.PRODUCT_FRANCHISE_ID,
        message: "Invalid product_franchise_id",
      });
    }

    if (new Date(dto.start_date) > new Date(dto.end_date)) {
      errors.push({
        field: PromotionFieldName.START_DATE,
        message: "Start date must be before end date",
      });
    }

    dto.created_by = loggedUserId;

    if (errors.length) {
      throw new HttpException(HttpStatus.BadRequest, "", errors);
    }
  }

  protected async afterCreate(
    item: IPromotion,
    loggedUserId: string,
  ): Promise<void> {
    const snapshot = pickAuditSnapshot(item, AUDIT_FIELDS_ITEM);

    await this.auditLogger.log({
      entityType: AuditEntityType.PROMOTION,
      entityId: String(item._id),
      action: AuditAction.CREATE,
      newData: snapshot,
      changedBy: loggedUserId,
    });
  }

  protected async beforeUpdate(
    current: IPromotion,
    dto: UpdatePromotionDto,
    loggedUserId: string,
  ): Promise<void> {
    await checkEmptyObject(dto);

    const errors: IError[] = [];

    const start = dto.start_date
      ? new Date(dto.start_date)
      : current.start_date;

    const end = dto.end_date ? new Date(dto.end_date) : current.end_date;

    if (start >= end) {
      errors.push({
        field: PromotionFieldName.START_DATE,
        message: "start date must be before end date",
      });
    }

    if (errors.length) {
      throw new HttpException(HttpStatus.BadRequest, "", errors);
    }
  }

  protected async afterUpdate(
    oldItem: IPromotion,
    newItem: IPromotion,
    loggedUserId: string,
  ): Promise<void> {
    const { oldData, newData } = buildAuditDiff(
      oldItem,
      newItem,
      AUDIT_FIELDS_ITEM,
    );

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

  protected async afterDelete(
    item: IPromotion,
    loggedUserId: string,
  ): Promise<void> {
    await this.auditLogger.log({
      entityType: AuditEntityType.PROMOTION,
      entityId: String(item._id),
      action: AuditAction.SOFT_DELETE,
      oldData: { is_deleted: false },
      newData: { is_deleted: true },
      changedBy: loggedUserId,
    });
  }

  protected async afterRestore(
    item: IPromotion,
    loggedUserId: string,
  ): Promise<void> {
    await this.auditLogger.log({
      entityType: AuditEntityType.PROMOTION,
      entityId: String(item._id),
      action: AuditAction.RESTORE,
      oldData: { is_deleted: true },
      newData: { is_deleted: false },
      changedBy: loggedUserId,
    });
  }

  protected async doSearch(
    dto: SearchPaginationItemDto,
  ): Promise<{ data: IPromotion[]; total: number }> {
    return (this.repo as PromotionRepository).getItems(dto);
  }

  public async getById(id: string) {
    return this.repo.findById(id);
  }

  public async changeStatus(
    id: string,
    is_active: boolean,
    loggedUserId: string,
  ): Promise<IPromotion | null> {
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

  public async getAllPromotionsByProductFranchiseId(
    productFranchiseId: string,
  ) {
    return this.repo.find({
      product_franchise_id: productFranchiseId,
      is_deleted: false,
    });
  }
}
