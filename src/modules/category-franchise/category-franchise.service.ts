import { MSG_BUSINESS } from "../../core/constants";
import { BaseFieldName, HttpStatus } from "../../core/enums";
import { HttpException } from "../../core/exceptions";
import { checkEmptyObject } from "../../core/utils";
import { AuditAction, AuditEntityType, IAuditLogger, pickAuditSnapshot } from "../audit-log";
import { ICategoryQuery } from "../category";
import { IFranchiseQuery } from "../franchise";
import { CategoryFranchiseFieldName } from "./category-franchise.enum";
import { ICategoryFranchise, ICategoryFranchisePopulated } from "./category-franchise.interface";
import { mapItemToResponse } from "./category-franchise.mapper";
import { CategoryFranchiseRepository } from "./category-franchise.repository";
import CreateCategoryFranchiseDto from "./dto/create.dto";
import { CategoryFranchiseItemDto } from "./dto/item.dto";
import { UpdateDisplayOrderItemDto, UpdateDisplayOrderItemsDto } from "./dto/updateDisplayOrder.dto";
import UpdateStatusDto from "./dto/updateStatus.dto";

const AUDIT_FIELDS_ITEM = [
  CategoryFranchiseFieldName.CATEGORY_ID,
  CategoryFranchiseFieldName.FRANCHISE_ID,
  BaseFieldName.DISPLAY_ORDER,
] as readonly (keyof ICategoryFranchise)[];

export class CategoryFranchiseService {
  constructor(
    private readonly repo: CategoryFranchiseRepository,
    private readonly categoryQuery: ICategoryQuery,
    private readonly franchiseQuery: IFranchiseQuery,
    private readonly auditLogger: IAuditLogger,
  ) {}

  /**
   * Add a category to a franchise menu
   */
  public async addCategoryToFranchise(
    dto: CreateCategoryFranchiseDto,
    loggedUserId: string,
  ): Promise<ICategoryFranchise> {
    await checkEmptyObject(dto);

    const { franchise_id, category_id, display_order } = dto;

    // 1. Validate franchise exists
    const franchise = await this.franchiseQuery.getById(franchise_id);
    if (!franchise) {
      throw new HttpException(HttpStatus.NotFound, MSG_BUSINESS.ITEM_NOT_FOUND_WITH_NAME("Franchise"));
    }

    // 2. Validate category exists
    const category = await this.categoryQuery.getById(category_id);
    if (!category) {
      throw new HttpException(HttpStatus.NotFound, MSG_BUSINESS.ITEM_NOT_FOUND_WITH_NAME("Category"));
    }

    // 3. Prevent duplicate
    const existed = await this.repo.findByCategoryAndFranchise(category_id, franchise_id);
    if (existed) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.ITEM_EXISTS("Category in franchise"));
    }

    // 4. Create mapping
    const item = await this.repo.create({
      category_id: category_id,
      franchise_id: franchise_id,
      display_order: display_order ?? 1,
      is_active: true,
    });

    // 5. Audit log
    const snapshot = pickAuditSnapshot(item, AUDIT_FIELDS_ITEM);
    await this.auditLogger.log({
      entityType: AuditEntityType.CATEGORY_FRANCHISE,
      entityId: String(item._id),
      action: AuditAction.CREATE,
      newData: snapshot,
      changedBy: loggedUserId,
    });

    return item;
  }

  /**
   * Get menu categories of a franchise
   */
  public async getCategoriesByFranchise(
    franchiseId: string,
    isActive: boolean | undefined,
  ): Promise<CategoryFranchiseItemDto[]> {
    const items = (await this.repo
      .findByFranchise(franchiseId, isActive)
      .populate("category_id", "name")
      .populate("franchise_id", "name")) as unknown as ICategoryFranchisePopulated[];

    return items.map(mapItemToResponse);
  }

  /**
   * Update active status
   */
  public async changeStatus(id: string, dto: UpdateStatusDto, loggedUserId: string): Promise<void> {
    const { is_active } = dto;

    const currentItem = await this.getActiveItemOrThrow(id);

    if (currentItem.is_active === is_active) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.STATUS_NO_CHANGE);
    }

    // 1. Update status
    await this.repo.update(id, { is_active });

    // 2. Audit log
    await this.auditLogger.log({
      entityType: AuditEntityType.CATEGORY_FRANCHISE,
      entityId: id,
      action: AuditAction.CHANGE_STATUS,
      oldData: { is_active: currentItem.is_active },
      newData: { is_active },
      changedBy: loggedUserId,
    });
  }

  /**
   * Update display order
   */
  public async changeDisplayOrderItem(dto: UpdateDisplayOrderItemDto, loggedUserId: string): Promise<void> {
    const { display_order, id } = dto;

    const currentItem = await this.getActiveItemOrThrow(id);

    if (currentItem.display_order === display_order) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.NO_DATA_TO_UPDATE);
    }

    // 1. Update display order
    await this.repo.update(id, { display_order });

    // 2. Audit log
    await this.auditLogger.log({
      entityType: AuditEntityType.CATEGORY_FRANCHISE,
      entityId: id,
      action: AuditAction.DISPLAY_ORDER,
      oldData: { display_order: currentItem.display_order },
      newData: { display_order },
      changedBy: loggedUserId,
    });
  }

  /**
   * Reorder menu categories (drag & drop)
   */
  public async reorderCategories(dto: UpdateDisplayOrderItemsDto, loggedUserId: string): Promise<void> {
    const { franchise_id, items } = dto;

    if (!items || items.length === 0) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.ITEMS_NOT_FOUND);
    }

    // 1. Validate no duplicate ids in the request
    const uniqueIds = new Set(items.map((i) => i.id));
    if (uniqueIds.size !== items.length) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.DUPLICATE_IDS_IN_REQUEST("CategoryFranchise"));
    }

    // 2. Get current items in the franchise
    const currentItems = await this.repo.findByFranchise(franchise_id, undefined);

    const currentMap = new Map(currentItems.map((item) => [item._id.toString(), item]));

    // 3. Validate all items belong to this franchise
    for (const item of items) {
      const current = currentMap.get(item.id);
      if (!current) {
        throw new HttpException(
          HttpStatus.BadRequest,
          `CategoryFranchise ${item.id} does not belong to this franchise`,
        );
      }
    }

    // 3. Check if there is any actual change
    const hasChange = items.some((item) => {
      const current = currentMap.get(item.id)!;
      return current.display_order !== item.display_order;
    });

    if (!hasChange) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.NO_DATA_TO_UPDATE);
    }

    // 4. Bulk update (should be in transaction if Mongo session is used)
    await this.repo.bulkUpdateOrder(items);

    // 5. Audit log (summary log – do not log each item)
    await this.auditLogger.log({
      entityType: AuditEntityType.CATEGORY_FRANCHISE,
      entityId: franchise_id,
      action: AuditAction.DISPLAY_ORDER,
      note: "Reorder category menu",
      oldData: currentItems.map((i) => ({
        id: i._id,
        display_order: i.display_order,
      })),
      newData: items,
      changedBy: loggedUserId,
    });
  }

  /**
   * Remove category from franchise (soft delete)
   */
  public async softDeleteItem(id: string, loggedUserId: string) {
    await this.getActiveItemOrThrow(id);

    // 1. Soft delete
    await this.repo.softDeleteById(id);

    // 2. Audit log
    await this.auditLogger.log({
      entityType: AuditEntityType.CATEGORY_FRANCHISE,
      entityId: id,
      action: AuditAction.SOFT_DELETE,
      oldData: { is_deleted: false },
      newData: { is_deleted: true },
      changedBy: loggedUserId,
    });
  }

  /**
   * Restore category from franchise
   */
  public async restoreItem(id: string, loggedUserId: string) {
    const item = await this.repo.findById(id, true); // ensure item exists
    if (!item) {
      throw new HttpException(HttpStatus.NotFound, MSG_BUSINESS.ITEM_NOT_FOUND_OR_RESTORED);
    }

    // 1. Restore
    await this.repo.restoreById(id);

    // 2. Audit log
    await this.auditLogger.log({
      entityType: AuditEntityType.CATEGORY_FRANCHISE,
      entityId: id,
      action: AuditAction.RESTORE,
      oldData: { is_deleted: true },
      newData: { is_deleted: false },
      changedBy: loggedUserId,
    });
  }

  private async getActiveItemOrThrow(id: string) {
    const item = await this.repo.findById(id);
    if (!item || item.is_deleted) {
      throw new HttpException(HttpStatus.NotFound, MSG_BUSINESS.ITEM_NOT_FOUND_WITH_NAME("CategoryFranchise"));
    }
    return item;
  }
}
