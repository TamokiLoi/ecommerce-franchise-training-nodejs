import { mapBaseResponseNoActive } from "../../core/mappers";
import { ShiftAssignmentItemDto } from "./dto/item.dto";
import { IShiftAssignment } from "./shift-assignment.interface";

export const mapItemToResponse = (item: IShiftAssignment): ShiftAssignmentItemDto => {
  const base = mapBaseResponseNoActive(item);
  return {
    ...base,
    shift_id: item.shift_id,
    user_id: item.user_id,
    user_name: item.user_name,
    start_time: item.start_time,
    end_time: item.end_time,
    note: item.note || "",
    work_date: item.work_date,
    assigned_by: item.assigned_by,
    status: item.status,
  };
};
