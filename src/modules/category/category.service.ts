import { MSG_BUSINESS } from "../../core/constants";
import { BaseFieldName, HttpStatus } from "../../core/enums";
import { HttpException } from "../../core/exceptions";
import { IError } from "../../core/interfaces";
import { BaseCrudService } from "../../core/services";
import { checkEmptyObject, normalizeCode, normalizeName } from "../../core/utils";
import { AuditAction, AuditEntityType, buildAuditDiff, IAuditLogger, pickAuditSnapshot } from "../audit-log";
import { CategoryFieldName } from "./category.enum";
import { ICategory, ICategoryQuery } from "./category.interface";
import { CategoryRepository } from "./category.repository";
import CreateCategoryDto from "./dto/create.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import UpdateCategoryDto from "./dto/update.dto";

const AUDIT_FIELDS_ITEM = [
  BaseFieldName.CODE,
  BaseFieldName.NAME,
  BaseFieldName.DESCRIPTION,
  CategoryFieldName.PARENT_ID,
] as readonly (keyof ICategory)[];

export class CategoryService
  extends BaseCrudService<ICategory, CreateCategoryDto, UpdateCategoryDto, SearchPaginationItemDto>
  implements ICategoryQuery
{
  private readonly categoryRepo: CategoryRepository;

  constructor(
    repo: CategoryRepository,
    private readonly auditLogger: IAuditLogger,
  ) {
    super(repo);
    this.categoryRepo = repo;
  }

  // ===== Start CRUD =====
  protected async beforeCreate(dto: CreateCategoryDto, loggedUserId: string): Promise<void> {
    await checkEmptyObject(dto);

    const errors: IError[] = [];

    const normalizedCode = normalizeCode(dto.code);
    const normalizedName = normalizeName(dto.name);

    // 1. Check unique code
    if (await this.repo.existsByField(BaseFieldName.CODE, normalizedCode)) {
      errors.push({
        field: BaseFieldName.CODE,
        message: MSG_BUSINESS.ITEM_EXISTS("Category code"),
      });
    }

    // 2. Check parent_id exists
    if (dto.parent_id) {
      await this.validateParentCategory(dto.parent_id, errors);
    }

    if (errors.length) {
      throw new HttpException(HttpStatus.BadRequest, "", errors);
    }

    // 3. Normalize data (mutate dto – OK service)
    dto.code = normalizedCode;
    dto.name = normalizedName;
  }

  protected async afterCreate(item: ICategory, loggedUserId: string): Promise<void> {
    const snapshot = pickAuditSnapshot(item, AUDIT_FIELDS_ITEM);
    await this.auditLogger.log({
      entityType: AuditEntityType.CATEGORY,
      entityId: String(item._id),
      action: AuditAction.CREATE,
      newData: snapshot,
      changedBy: loggedUserId,
    });
  }

  protected async beforeUpdate(current: ICategory, dto: UpdateCategoryDto, loggedUserId: string): Promise<void> {
    await checkEmptyObject(dto);

    const errors: IError[] = [];

    const nextCode = dto.code ? normalizeCode(dto.code) : current.code;
    const nextName = dto.name ? normalizeName(dto.name) : current.name;

    // 1. Unique code (exclude itself)
    if (
      dto.code &&
      (await this.repo.existsByField(BaseFieldName.CODE, nextCode, { excludeId: current._id.toString() }))
    ) {
      errors.push({
        field: BaseFieldName.CODE,
        message: MSG_BUSINESS.ITEM_EXISTS("Category code"),
      });
    }

    // 2. Check parent_id exists
    if (dto.parent_id) {
      // Prevent setting itself as parent
      if (dto.parent_id === current._id.toString()) {
        errors.push({
          field: CategoryFieldName.PARENT_ID,
          message: "Category cannot be its own parent",
        });
      } else if (dto.parent_id !== current.parent_id) {
        await this.validateParentCategory(dto.parent_id, errors);
      }
    }

    if (errors.length) {
      throw new HttpException(HttpStatus.BadRequest, "", errors);
    }

    // 3. Normalize (mutate dto)
    if (dto.code) dto.code = nextCode;
    if (dto.name) dto.name = nextName;
  }

  protected async afterUpdate(oldItem: ICategory, newItem: ICategory, loggedUserId: string): Promise<void> {
    const { oldData, newData } = buildAuditDiff(oldItem, newItem, AUDIT_FIELDS_ITEM);

    if (newData && Object.keys(newData).length > 0) {
      await this.auditLogger.log({
        entityType: AuditEntityType.CATEGORY,
        entityId: String(oldItem._id),
        action: AuditAction.UPDATE,
        oldData,
        newData,
        changedBy: loggedUserId,
      });
    }
  }

  protected async afterDelete(item: ICategory, loggedUserId: string): Promise<void> {
    await this.auditLogger.log({
      entityType: AuditEntityType.CATEGORY,
      entityId: String(item._id),
      action: AuditAction.SOFT_DELETE,
      oldData: { is_deleted: false },
      newData: { is_deleted: true },
      changedBy: loggedUserId,
    });
  }

  protected async afterRestore(item: ICategory, loggedUserId: string): Promise<void> {
    await this.auditLogger.log({
      entityType: AuditEntityType.CATEGORY,
      entityId: String(item._id),
      action: AuditAction.RESTORE,
      oldData: { is_deleted: true },
      newData: { is_deleted: false },
      changedBy: loggedUserId,
    });
  }

  protected async doSearch(dto: SearchPaginationItemDto): Promise<{ data: ICategory[]; total: number }> {
    return this.categoryRepo.getItems(dto);
  }
  // ===== End CRUD =====

  // Validate parent category existence
  private async validateParentCategory(parentId: string, errors: IError[]) {
    const parent = await this.categoryRepo.findOne({ _id: parentId, is_deleted: false });
    if (!parent) {
      errors.push({
        field: CategoryFieldName.PARENT_ID,
        message: MSG_BUSINESS.ITEM_NOT_FOUND_WITH_NAME("Parent category"),
      });
    }
  }

  // Support for api get all categories (no pagination, no filter)
  public async getAllCategories(): Promise<ICategory[]> {
    return this.repo.findAll();
  }

  // Support for ICategoryQuery
  public async getById(id: string): Promise<ICategory | null> {
    return this.repo.findById(id);
  }
}
