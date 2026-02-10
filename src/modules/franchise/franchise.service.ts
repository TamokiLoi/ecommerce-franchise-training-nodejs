import { Types } from "mongoose";
import { MSG_BUSINESS } from "../../core/constants";
import { BaseFieldName, HttpStatus } from "../../core/enums";
import { HttpException } from "../../core/exceptions";
import { IError } from "../../core/interfaces";
import { BaseCrudService } from "../../core/services";
import { checkEmptyObject, normalizeCode, normalizeName, toMinutes } from "../../core/utils";
import { AuditAction, AuditEntityType, buildAuditDiff, IAuditLogger, pickAuditSnapshot } from "../audit-log";
import CreateFranchiseDto from "./dto/create.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import UpdateFranchiseDto from "./dto/update.dto";
import UpdateStatusDto from "./dto/updateStatus.dto";
import { FranchiseFieldName } from "./franchise.enum";
import { IFranchise, IFranchiseQuery, IFranchiseQueryResult } from "./franchise.interface";
import { FranchiseRepository } from "./franchise.repository";

type FranchiseTimeContext = {
  opened_at: string;
  closed_at: string;
};

const AUDIT_FIELDS_ITEM = [
  BaseFieldName.CODE,
  BaseFieldName.NAME,
  FranchiseFieldName.OPENED_AT,
  FranchiseFieldName.CLOSED_AT,
  FranchiseFieldName.HOTLINE,
  FranchiseFieldName.LOGO_URL,
  FranchiseFieldName.ADDRESS,
] as readonly (keyof IFranchise)[];

export default class FranchiseService
  extends BaseCrudService<IFranchise, CreateFranchiseDto, UpdateFranchiseDto, SearchPaginationItemDto>
  implements IFranchiseQuery
{
  private readonly franchiseRepo: FranchiseRepository;

  constructor(
    repo: FranchiseRepository,
    private readonly auditLogger: IAuditLogger,
  ) {
    super(repo);
    this.franchiseRepo = repo;
  }

  // ===== Start CRUD =====
  protected async beforeCreate(dto: CreateFranchiseDto, loggedUserId: string): Promise<void> {
    await checkEmptyObject(dto);

    const errors: IError[] = [];

    const normalizedCode = normalizeCode(dto.code);
    const normalizedName = normalizeName(dto.name);

    // 1. Check unique code
    if (await this.repo.existsByField(BaseFieldName.CODE, normalizedCode)) {
      errors.push({
        field: BaseFieldName.CODE,
        message: MSG_BUSINESS.ITEM_EXISTS("Franchise code"),
      });
    }

    // 2. Business rules (OPEN < CLOSE)
    this.validateBusinessRules(
      {
        opened_at: dto.opened_at,
        closed_at: dto.closed_at,
      },
      errors,
    );

    if (errors.length) {
      throw new HttpException(HttpStatus.BadRequest, "", errors);
    }

    // 3. Normalize data (mutate dto – OK service)
    dto.code = normalizedCode;
    dto.name = normalizedName;
  }

  protected async afterCreate(item: IFranchise, loggedUserId: string): Promise<void> {
    const snapshot = pickAuditSnapshot(item, AUDIT_FIELDS_ITEM);

    await this.auditLogger.log({
      entityType: AuditEntityType.FRANCHISE,
      entityId: String(item._id),
      action: AuditAction.CREATE,
      newData: snapshot,
      changedBy: loggedUserId,
    });
  }

  protected async beforeUpdate(current: IFranchise, dto: UpdateFranchiseDto, loggedUserId: string): Promise<void> {
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
        message: MSG_BUSINESS.ITEM_EXISTS("Franchise code"),
      });
    }

    // 2. Business rules
    this.validateBusinessRules(
      {
        opened_at: dto.opened_at ?? current.opened_at,
        closed_at: dto.closed_at ?? current.closed_at,
      },
      errors,
    );

    if (errors.length) {
      throw new HttpException(HttpStatus.BadRequest, "", errors);
    }

    // 3. Normalize (mutate dto)
    if (dto.code) dto.code = nextCode;
    if (dto.name) dto.name = nextName;
  }

  protected async afterUpdate(oldItem: IFranchise, newItem: IFranchise, loggedUserId: string): Promise<void> {
    const { oldData, newData } = buildAuditDiff(oldItem, newItem, AUDIT_FIELDS_ITEM);

    if (newData && Object.keys(newData).length > 0) {
      await this.auditLogger.log({
        entityType: AuditEntityType.FRANCHISE,
        entityId: String(oldItem._id),
        action: AuditAction.UPDATE,
        oldData,
        newData,
        changedBy: loggedUserId,
      });
    }
  }

  protected async afterDelete(item: IFranchise, loggedUserId: string): Promise<void> {
    await this.auditLogger.log({
      entityType: AuditEntityType.FRANCHISE,
      entityId: String(item._id),
      action: AuditAction.SOFT_DELETE,
      oldData: { is_deleted: false },
      newData: { is_deleted: true },
      changedBy: loggedUserId,
    });
  }

  protected async afterRestore(item: IFranchise, loggedUserId: string): Promise<void> {
    await this.auditLogger.log({
      entityType: AuditEntityType.FRANCHISE,
      entityId: String(item._id),
      action: AuditAction.RESTORE,
      oldData: { is_deleted: true },
      newData: { is_deleted: false },
      changedBy: loggedUserId,
    });
  }

  protected async doSearch(dto: SearchPaginationItemDto): Promise<{ data: IFranchise[]; total: number }> {
    return this.franchiseRepo.getItems(dto);
  }
  // ===== END CRUD =====

  public async changeStatus(id: string, data: UpdateStatusDto, loggedUserId: string): Promise<void> {
    const { is_active } = data;

    const currentItem = await this.repo.findById(id);
    if (!currentItem) {
      throw new HttpException(HttpStatus.NotFound, MSG_BUSINESS.ITEM_NOT_FOUND);
    }

    if (currentItem.is_active === is_active) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.STATUS_NO_CHANGE);
    }

    // 1. Update status
    await this.repo.update(id, { is_active });

    // 2. Audit log
    await this.auditLogger.log({
      entityType: AuditEntityType.FRANCHISE,
      entityId: id,
      action: AuditAction.CHANGE_STATUS,
      oldData: { is_active: currentItem.is_active },
      newData: { is_active },
      changedBy: loggedUserId,
    });
  }

  // Support for api get all franchises (no pagination, no filter)
  public async getAllFranchises(): Promise<IFranchise[]> {
    return this.repo.findAll();
  }

  public async getByIds(ids: string[]): Promise<IFranchiseQueryResult[]> {
    const objectIds = ids.map((id) => new Types.ObjectId(id));

    const items = await this.repo.find({
      _id: { $in: objectIds },
      is_deleted: false,
    });

    return items.map((r) => ({
      id: r._id.toString(),
      code: r.code,
      name: r.name,
    }));
  }

  public async getById(id: string): Promise<IFranchise | null> {
    return this.repo.findById(id);
  }

  private validateBusinessRules(data: FranchiseTimeContext, errors: IError[]) {
    const openMinutes = toMinutes(data.opened_at);
    const closeMinutes = toMinutes(data.closed_at);

    if (openMinutes >= closeMinutes) {
      errors.push(
        {
          field: FranchiseFieldName.OPENED_AT,
          message: MSG_BUSINESS.OPENED_BEFORE_CLOSED,
        },
        {
          field: FranchiseFieldName.CLOSED_AT,
          message: MSG_BUSINESS.CLOSED_AFTER_OPENED,
        },
      );
    }
  }
}
