import { Types } from "mongoose";
import {
  BaseCrudService,
  BaseFieldName,
  checkEmptyObject,
  HttpException,
  HttpStatus,
  IError,
  MSG_BUSINESS,
} from "../../core";
import { ShiftAssignmentStatus } from "../../core/enums/base.enum";
import { AuditAction, AuditEntityType, buildAuditDiff, IAuditLogger } from "../audit-log";
import { IShiftQuery } from "../shift/shift.interface";
import { IUserFranchiseRoleQuery } from "../user-franchise-role";
import { IUserQuery } from "../user/user.interface";
import { CreateShiftAssignmentDto } from "./dto/create.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import { UpdateStatusDto } from "./dto/update.dto";
import { IShiftAssignment, IShiftAssignmentQuery } from "./shift-assignment.interface";
import { ShiftAssignmentRepository } from "./shift-assignment.repository";
export const AUDIT_FIELDS_ITEM = [
  BaseFieldName.USER_ID,
  BaseFieldName.SHIFT_ID,
  BaseFieldName.WORK_DATE,
  BaseFieldName.FRANCHISE_ID,
  BaseFieldName.ASSIGNED_BY,
  BaseFieldName.STATUS,
] as readonly (keyof IShiftAssignment)[];

export class ShiftAssignmentService
  extends BaseCrudService<IShiftAssignment, CreateShiftAssignmentDto, UpdateStatusDto, SearchPaginationItemDto>
  implements IShiftAssignmentQuery
{
  private readonly shiftAssignRepo: ShiftAssignmentRepository;

  constructor(
    repo: ShiftAssignmentRepository,

    private readonly shiftQuery: IShiftQuery,
    private readonly userQuery: IUserQuery,
    private readonly userFranchiseRoleQuery: IUserFranchiseRoleQuery,
    private readonly auditLogger: IAuditLogger,
  ) {
    super(repo);
    this.shiftAssignRepo = repo;
  }

  public async beforeCreate(dto: CreateShiftAssignmentDto, loggedUserId: string): Promise<void> {
    await checkEmptyObject(dto);

    dto.assigned_by = new Types.ObjectId(loggedUserId);

    const errors: IError[] = [];

    const user = await this.userQuery.getUserById(dto.user_id.toString());
    if (!user) {
      throw new HttpException(HttpStatus.BAD_REQUEST, "User not found");
    }

    const shift = await this.shiftQuery.getById(dto.shift_id.toString());
    if (!shift) {
      throw new HttpException(HttpStatus.BAD_REQUEST, "Shift not found");
    }
    // Get existing assignments of user on the same date
    const existingAssignments = await this.shiftAssignRepo.getAllByUserIdAndDate(dto.user_id.toString(), dto.work_date);

    const toMinutes = (time: string) => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };

    const newStart = toMinutes(shift.start_time);
    const newEnd = toMinutes(shift.end_time);

    for (const assignment of existingAssignments) {
      const assignedShift = await this.shiftQuery.getById(String(assignment.shift_id));

      if (!assignedShift) continue;

      const assignedStart = toMinutes(assignedShift.start_time);
      const assignedEnd = toMinutes(assignedShift.end_time);

      const isOverlap = newStart < assignedEnd && assignedStart < newEnd;

      if (isOverlap) {
        throw new HttpException(HttpStatus.BAD_REQUEST, "User already assigned to another overlapping shift");
      }
    }

    const franchiseId = await this.shiftQuery.getFranchiseIdByShiftId(dto.shift_id.toString());
    if (!franchiseId) {
      throw new HttpException(HttpStatus.BAD_REQUEST, "Franchise not found");
    }
    // Check if a shift assignment already exists for the same user on the same work date
    const isExistAssignedUser = await this.shiftAssignRepo.getAllByUserIdAndDate(dto.user_id.toString(), dto.work_date);
    if (isExistAssignedUser.length > 0) {
      throw new HttpException(HttpStatus.BAD_REQUEST, "Shift assignment already exists for this user on this date");
    }

    //TODO lay franchise id user co thuoc franchise do khong
    const userFranchiseRole = await this.userFranchiseRoleQuery.checkExistByFranchiseAndUser(
      franchiseId,
      dto.user_id.toString(),
    );
    if (!userFranchiseRole) {
      throw new HttpException(HttpStatus.BAD_REQUEST, "User franchise role not found");
    }

    const isExist = await this.repo.existsByFilter({
      [BaseFieldName.USER_ID]: new Types.ObjectId(dto.user_id),
      [BaseFieldName.WORK_DATE]: dto.work_date,
      [BaseFieldName.SHIFT_ID]: new Types.ObjectId(dto.shift_id),
    });
    if (!shift) {
      errors.push({
        field: BaseFieldName.SHIFT_ID,
        message: MSG_BUSINESS.ITEM_NOT_FOUND_WITH_NAME("Shift"),
      });
    }

    const workDate = new Date(dto.work_date);

    const today = new Date();
    today.setHours(0, 0, 0, 0); // reset time

    if (workDate < today) {
      throw new HttpException(HttpStatus.BAD_REQUEST, "Cannot assign shift for past dates");
    }

    if (!user) {
      errors.push({
        field: BaseFieldName.USER_ID,
        message: MSG_BUSINESS.ITEM_NOT_FOUND_WITH_NAME("User"),
      });
    }

    if (isExist) {
      errors.push({
        field: BaseFieldName.WORK_DATE,
        message: MSG_BUSINESS.ITEM_EXISTS(`Shift assignment for user on work date '${dto.work_date}'`),
      });
    }

    if (errors.length) {
      throw new HttpException(HttpStatus.BadRequest, "", errors);
    }
  }

  public async afterCreate(item: IShiftAssignment, loggedUserId: string): Promise<void> {
    await this.auditLogger.log({
      entityType: AuditEntityType.SHIFT_ASSIGNMENT,
      entityId: String(item._id),
      action: AuditAction.CREATE,
      newData: item,
      changedBy: loggedUserId,
    });
  }

  public async beforeUpdate(current: IShiftAssignment, payload: UpdateStatusDto): Promise<void> {
    if (payload.status === undefined) return;

    const allowedNextStatuses = [ShiftAssignmentStatus.COMPLETED, ShiftAssignmentStatus.ABSENT];

    if (!allowedNextStatuses.includes(payload.status)) {
      throw new HttpException(HttpStatus.BAD_REQUEST, "Status can only change to COMPLETED or ABSENT");
    }

    if (current.status !== ShiftAssignmentStatus.ASSIGNED) {
      throw new HttpException(HttpStatus.BAD_REQUEST, "Status can only be updated from ASSIGNED");
    }

    if (current.status === payload.status) {
      throw new HttpException(HttpStatus.BAD_REQUEST, MSG_BUSINESS.STATUS_NO_CHANGE);
    }
  }

  public async beforeDelete(item: IShiftAssignment): Promise<void> {
    const isExist = await this.repo.existsByFilter({
      [BaseFieldName.USER_ID]: new Types.ObjectId(item.user_id),
      [BaseFieldName.WORK_DATE]: item.work_date,
      _id: { $ne: item._id },
    });

    if (isExist) {
      throw new HttpException(
        HttpStatus.BadRequest,
        MSG_BUSINESS.ITEM_EXISTS(`Shift assignment for user on work date '${item.work_date}'`),
      );
    }
  }

  public async beforeRestore(item: IShiftAssignment): Promise<void> {
    const isExist = await this.repo.existsByFilter({
      [BaseFieldName.USER_ID]: new Types.ObjectId(item.user_id),
      [BaseFieldName.WORK_DATE]: item.work_date,
      _id: { $ne: item._id },
    });
    if (isExist) {
      throw new HttpException(
        HttpStatus.BadRequest,
        MSG_BUSINESS.ITEM_EXISTS(`Shift assignment for user on work date '${item.work_date}'`),
      );
    }
  }

  public async afterUpdate(oldItem: IShiftAssignment, newItem: IShiftAssignment, loggedUserId: string): Promise<void> {
    const { oldData, newData } = buildAuditDiff(oldItem, newItem, AUDIT_FIELDS_ITEM);

    if (newData && Object.keys(newData).length > 0) {
      await this.auditLogger.log({
        entityType: AuditEntityType.SHIFT_ASSIGNMENT,
        entityId: String(oldItem._id),
        action: AuditAction.UPDATE,
        oldData,
        newData,
        changedBy: loggedUserId,
      });
    }
  }

  public async afterDelete(item: IShiftAssignment, loggedUserId: string): Promise<void> {
    await this.auditLogger.log({
      entityType: AuditEntityType.SHIFT_ASSIGNMENT,
      entityId: String(item._id),
      action: AuditAction.SOFT_DELETE,
      oldData: { is_deleted: false },
      newData: { is_deleted: true },
      changedBy: loggedUserId,
    });
  }

  public async afterRestore(item: IShiftAssignment, loggedUserId: string): Promise<void> {
    await this.auditLogger.log({
      entityType: AuditEntityType.SHIFT_ASSIGNMENT,
      entityId: String(item._id),
      action: AuditAction.RESTORE,
      oldData: { is_deleted: true },
      newData: { is_deleted: false },
      changedBy: loggedUserId,
    });
  }

  public async doSearch(model: SearchPaginationItemDto): Promise<{ data: IShiftAssignment[]; total: number }> {
    return this.shiftAssignRepo.doSearch(model);
  }

  public async createItem(item: CreateShiftAssignmentDto, loggedUserId: string): Promise<IShiftAssignment> {
    await this.beforeCreate(item, loggedUserId);
    const createdItem = await this.repo.create(item);
    await this.afterCreate(createdItem, loggedUserId);
    return createdItem;
  }

  public async getById(id: string): Promise<IShiftAssignment | null> {
    return this.shiftAssignRepo.getById(id);
  }

  public async changeStatus(id: string, model: UpdateStatusDto, loggedUserId: string): Promise<void> {
    const currentItem = await this.repo.findById(id);

    if (!currentItem) {
      throw new HttpException(HttpStatus.NotFound, MSG_BUSINESS.ITEM_NOT_FOUND);
    }

    await this.beforeUpdate(currentItem, model);
    console.log("🚀 ~ ShiftAssignmentService ~ changeStatus ~ model:", model);

    const { status } = model;
    console.log("🚀 ~ ShiftAssignmentService ~ changeStatus ~ status:", status);
    await this.repo.update(id, { status });

    await this.auditLogger.log({
      entityType: AuditEntityType.SHIFT_ASSIGNMENT,
      entityId: id,
      action: AuditAction.CHANGE_STATUS,
      oldData: { status: currentItem.status },
      newData: { status },
      changedBy: loggedUserId,
    });
  }

  public async getAllByUserIdAndDate(userId: string, date: string): Promise<IShiftAssignment[]> {
    return this.shiftAssignRepo.getAllByUserIdAndDate(userId, date);
  }

  public async getAllByFranchiseIdAndDate(franchiseId: string, date: string): Promise<IShiftAssignment[]> {
    return this.shiftAssignRepo.getAllByFranchiseIdAndDate(franchiseId, date);
  }

  public async getAllByShiftIdAndDate(shiftId: string, date: string): Promise<IShiftAssignment[] | null> {
    return this.shiftAssignRepo.getAllByShiftIdAndDate(shiftId, date);
  }

  public async getItemByShiftId(shiftId: string): Promise<IShiftAssignment | null> {
    return this.shiftAssignRepo.getItemByShiftId(shiftId);
  }

  public async createItems(items: CreateShiftAssignmentDto[], loggedUserId: string): Promise<IShiftAssignment[]> {
    const data: Partial<IShiftAssignment>[] = new Array(items.length);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await this.beforeCreate(item, loggedUserId);

      data[i] = {
        user_id: new Types.ObjectId(item.user_id),
        shift_id: new Types.ObjectId(item.shift_id),
        work_date: item.work_date,
        assigned_by: new Types.ObjectId(loggedUserId),
        status: ShiftAssignmentStatus.ASSIGNED,
      };
    }

    const createdItems = await this.repo.insertMany(data);

    for (let i = 0; i < createdItems.length; i++) {
      await this.afterCreate(createdItems[i], loggedUserId);
    }

    return createdItems;
  }
}

// TODO get all shift assignments
// get all shift assignment by franchise_id ( optional date)
// get all shift assignment by userid ( optional date)
