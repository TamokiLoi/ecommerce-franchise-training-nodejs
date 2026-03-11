import { Document, Types } from "mongoose";
import { BaseFieldName, ShiftAssignmentStatus } from "../../core/enums/base.enum";
import { IBaseNoActiveField } from "../../core/interfaces";
import { CreateShiftAssignmentDto } from "./dto/create.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";

export interface IShiftAssignment extends Document, IBaseNoActiveField {
  [BaseFieldName.SHIFT_ID]: Types.ObjectId;
  shift_name: string;
  start_time: string;
  end_time: string;
  [BaseFieldName.USER_ID]: Types.ObjectId;
  user_name: string;
  note: string;
  [BaseFieldName.WORK_DATE]: string;
  [BaseFieldName.ASSIGNED_BY]: Types.ObjectId;
  [BaseFieldName.STATUS]: ShiftAssignmentStatus;
}

export interface IShiftAssignmentQuery {
  getById(id: string): Promise<IShiftAssignment | null>;
  createItems(items: CreateShiftAssignmentDto[], loggedUserId: string): Promise<IShiftAssignment[]>;
  doSearch(model: SearchPaginationItemDto): Promise<{ data: IShiftAssignment[]; total: number }>;
  getItemByShiftId(shiftId: string): Promise<IShiftAssignment | null>;
  getAllByUserIdAndDate(userId: string, date: string): Promise<IShiftAssignment[]>;
  getAllByFranchiseIdAndDate(franchiseId: string, date: string): Promise<IShiftAssignment[]>;
  getAllByShiftIdAndDate(shiftId: string, date: string): Promise<IShiftAssignment[] | null>;
}
