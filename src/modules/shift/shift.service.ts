import { Types } from "mongoose";
import {
  BaseCrudService,
  BaseFieldName,
  checkEmptyObject,
  HttpException,
  HttpStatus,
  IError,
  MSG_BUSINESS,
  normalizeText,
  UpdateStatusDto,
} from "../../core";
import { IShift, IShiftQuery } from "./shift.interface";
import CreateShiftDto from "./dto/create.dto";
import UpdateShiftDto from "./dto/update.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import { ShiftRepository } from "./shift.repository";
import { AuditEntityType, AuditAction, IAuditLogger, buildAuditDiff, pickAuditSnapshot } from "../audit-log";
import { ShiftFieldName } from "./shift.enum";
import { IShiftAssignmentQuery } from "../shift-assignment";
import { ShiftItemDto } from "./dto/item.dto";

export const AUDIT_FIELDS_ITEM = [
  BaseFieldName.NAME,
  BaseFieldName.FRANCHISE_ID,
  ShiftFieldName.START_TIME,
  ShiftFieldName.END_TIME,
] as readonly (keyof IShift)[];

export class ShiftService
  extends BaseCrudService<IShift, CreateShiftDto, UpdateShiftDto, SearchPaginationItemDto>
  implements IShiftQuery
{
  private readonly shiftRepo: ShiftRepository;
  constructor(
    repo: ShiftRepository,
    private shiftAssign: IShiftAssignmentQuery,
    private readonly auditLogger: IAuditLogger,
  ) {
    super(repo);
    this.shiftRepo = repo;
  }

  // ===== Start CRUD =====

  protected async beforeCreate(dto: CreateShiftDto): Promise<void> {
    await checkEmptyObject(dto);

    const errors: IError[] = [];

    // Check unique name in franchise if name is being updated

    const normalizedName = normalizeText(dto.name);
    // We need to check name uniqueness within the same franchise
    const isExist = await this.repo.existsByFilter({
      [BaseFieldName.NAME]: normalizedName,
      [BaseFieldName.FRANCHISE_ID]: new Types.ObjectId(dto.franchise_id),
    });
    if (isExist) {
      errors.push({
        field: BaseFieldName.NAME,
        message: MSG_BUSINESS.ITEM_EXISTS(`Shift with Name: '${dto.name}' in this franchise`),
      });
    }

    // Check if a shift with the same start and end time exists in this franchise
    const isTimeExist = await this.repo.existsByFilter({
      [BaseFieldName.FRANCHISE_ID]: new Types.ObjectId(dto.franchise_id),
      [ShiftFieldName.START_TIME]: dto.start_time,
      [ShiftFieldName.END_TIME]: dto.end_time,
    });
    if (isTimeExist) {
      errors.push({
        field: ShiftFieldName.START_TIME,
        message: MSG_BUSINESS.ITEM_EXISTS(`Shift with Time: '${dto.start_time} - ${dto.end_time}' in this franchise`),
      });
    }

    if (errors.length) {
      throw new HttpException(HttpStatus.BadRequest, "", errors);
    }
  }

  protected async afterCreate(item: IShift, loggedUserId: string): Promise<void> {
    const snapshot = pickAuditSnapshot(item, AUDIT_FIELDS_ITEM);
    await this.auditLogger.log({
      entityType: AuditEntityType.SHIFT,
      entityId: String(item._id),
      action: AuditAction.CREATE,
      newData: snapshot,
      changedBy: loggedUserId,
    });
  }

  protected async beforeUpdate(current: IShift, payload: UpdateShiftDto, _loggedUserId: string): Promise<void> {
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
          message: MSG_BUSINESS.ITEM_EXISTS(`Shift with Name: '${payload.name}' in this franchise`),
        });
      }
    }

    // Check if a shift with the same start and end time exists in this franchise (exclude self)
    const nextStart = payload.start_time ?? current.start_time;
    const nextEnd = payload.end_time ?? current.end_time;
    if (nextStart !== current.start_time || nextEnd !== current.end_time) {
      const isTimeExist = await this.repo.existsByFilter({
        [BaseFieldName.FRANCHISE_ID]: new Types.ObjectId(current.franchise_id.toString()),
        [ShiftFieldName.START_TIME]: nextStart,
        [ShiftFieldName.END_TIME]: nextEnd,
        _id: { $ne: current._id },
      });
      if (isTimeExist) {
        errors.push({
          field: ShiftFieldName.START_TIME,
          message: MSG_BUSINESS.ITEM_EXISTS(`Shift with Time: '${nextStart} - ${nextEnd}' in this franchise`),
        });
      }
    }

    if (errors.length) {
      throw new HttpException(HttpStatus.BadRequest, "", errors);
    }

    const hasChange = (Object.keys(payload) as (keyof UpdateShiftDto)[]).some((key) => payload[key] !== current[key]);

    if (!hasChange) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.NO_DATA_TO_UPDATE);
    }
  }
  
  protected async beforeDelete(item: IShift, loggedUserId: string): Promise<void> {
    // check if shift has been assigned to any user
    const isExist = await this.shiftAssign.getItemByShiftId(item._id.toString());
    if (isExist) {
      throw new HttpException(HttpStatus.BAD_REQUEST, MSG_BUSINESS.SHIFT_IS_ASSIGNED_TO_SOME_USERS);
    }
  }

  protected async afterUpdate(oldItem: IShift, newItem: IShift, loggedUserId: string): Promise<void> {
    const { oldData, newData } = buildAuditDiff(oldItem, newItem, AUDIT_FIELDS_ITEM);

    if (newData && Object.keys(newData).length > 0) {
      await this.auditLogger.log({
        entityType: AuditEntityType.SHIFT,
        entityId: String(oldItem._id),
        action: AuditAction.UPDATE,
        oldData,
        newData,
        changedBy: loggedUserId,
      });
    }
  }

  protected async afterDelete(item: IShift, loggedUserId: string): Promise<void> {
    await this.auditLogger.log({
      entityType: AuditEntityType.SHIFT,
      entityId: String(item._id),
      action: AuditAction.SOFT_DELETE,
      oldData: { is_deleted: false },
      newData: { is_deleted: true },
      changedBy: loggedUserId,
    });
  }

  protected async afterRestore(item: IShift, loggedUserId: string): Promise<void> {
    await this.auditLogger.log({
      entityType: AuditEntityType.SHIFT,
      entityId: String(item._id),
      action: AuditAction.RESTORE,
      oldData: { is_deleted: true },
      newData: { is_deleted: false },
      changedBy: loggedUserId,
    });
  }

  protected async doSearch(dto: SearchPaginationItemDto): Promise<{ data: IShift[]; total: number }> {
    return this.shiftRepo.getItems(dto);
  }

  // ===== End CRUD =====

  // addition
  public async changeStatus(id: string, model: UpdateStatusDto, loggedUserId: string): Promise<void> {
    const { is_active } = model;

    // 1. Get item
    const currentItem = await this.repo.findById(id);
    if (!currentItem) {
      throw new HttpException(HttpStatus.NotFound, MSG_BUSINESS.ITEM_NOT_FOUND);
    }

    const isExist = await this.shiftAssign.getItemByShiftId(id);
    if (isExist) {
      throw new HttpException(HttpStatus.BAD_REQUEST, MSG_BUSINESS.SHIFT_IS_ASSIGNED_TO_SOME_USERS);
    }

    // 2. Check change status
    if (currentItem.is_active === is_active) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.STATUS_NO_CHANGE);
    }

    // 3. Update status
    await this.repo.update(id, { is_active });

    // 4. Audit log
    await this.auditLogger.log({
      entityType: AuditEntityType.SHIFT,
      entityId: id,
      action: AuditAction.CHANGE_STATUS,
      oldData: { is_active: currentItem.is_active },
      newData: { is_active },
      changedBy: loggedUserId,
    });
  }

  // Implement IShiftQuery
  public async getById(id: string): Promise<IShift | null> {
    return this.shiftRepo.getById(id);
  }

  // Support select dropdown: active shifts by franchise
  public async getAllShiftsByFranchise(franchiseId: string): Promise<IShift[]> {
    return this.shiftRepo.getShiftsByFranchise(franchiseId);
  }

  public async getAllShifts(): Promise<IShift[]> {
    return this.shiftRepo.findAll();
  }

  public async getFranchiseIdByShiftId(id: string): Promise<string | null> {
    return this.shiftRepo.getFranchiseIdByShiftId(id);
  }
  public setShiftAssignmentQuery(query: IShiftAssignmentQuery) {
    this.shiftAssign = query;
  }
}
