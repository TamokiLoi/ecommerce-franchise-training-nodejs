import { Types } from "mongoose";
import { ShiftAssignmentStatus } from "../../../core/enums/base.enum";
export interface ShiftAssignmentItemDto {
     id:string;
     shift_id:Types.ObjectId;
     user_id:Types.ObjectId;
     work_date:string;
     assigned_by:Types.ObjectId;
     status:ShiftAssignmentStatus; 
     is_deleted:boolean;
     created_at:string;
     updated_at:string;
}
