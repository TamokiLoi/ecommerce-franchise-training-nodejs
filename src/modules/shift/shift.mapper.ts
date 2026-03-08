import { mapBaseResponse } from "../../core/mappers";
import { IShift } from "./shift.interface";
import { ShiftItemDto } from "./dto/item.dto";

export const mapItemToResponse = (item: IShift): ShiftItemDto => {
     const base= mapBaseResponse(item);
  return {
    ...base,
    name: item.name,
    franchise_id: item.franchise_id, 
    start_time: item.start_time,
    end_time: item.end_time,
  };
};