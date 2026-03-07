import { Document, Types } from "mongoose";
import { IBaseNoActiveField } from "../../core/interfaces";
import { BaseFieldName, ShiftAssignmentStatus } from "../../core/enums/base.enum";
import { SearchPaginationItemDto } from "./dto/search.dto";
import { CreateShiftAssignmentDto } from "./dto/create.dto";

export interface IShiftAssignment extends Document, IBaseNoActiveField {
    [BaseFieldName.SHIFT_ID]: Types.ObjectId;
    [BaseFieldName.USER_ID]: Types.ObjectId;
    [BaseFieldName.WORK_DATE]: string;
    [BaseFieldName.ASSIGNED_BY]: Types.ObjectId;
    [BaseFieldName.STATUS]: ShiftAssignmentStatus;
}


export interface IShiftAssignmentQuery {
    getById(id: string): Promise<IShiftAssignment | null>;
    getAllShiftAssignmentsByFranchiseIdandDate(franchiseId: string,date:string): Promise<IShiftAssignment[]>;
    getAllShiftAssignmentsByUserIdAndDate(userId: string,date:string): Promise<IShiftAssignment[]>;
    createItems(items: CreateShiftAssignmentDto[],loggedUserId:string): Promise<IShiftAssignment[]>;
    doSearch(model: SearchPaginationItemDto): Promise<{ data: IShiftAssignment[]; total: number }>;
    getShiftAssignementByShiftId(shiftId: string): Promise<IShiftAssignment | null>;
    

}
