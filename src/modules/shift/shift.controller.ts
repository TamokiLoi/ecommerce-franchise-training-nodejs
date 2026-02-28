import { BaseCrudController } from "../../core";
import CreateShiftDto from "./dto/create.dto";
import { ShiftItemDto } from "./dto/item.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import UpdateShiftDto from "./dto/update.dto";
import { IShift } from "./shift.interface";
import { ShiftService } from "./shift.service";
import { mapItemToResponse } from "./shift.mapper";

export class ShiftController extends BaseCrudController<
IShift,
CreateShiftDto,
ShiftItemDto,
UpdateShiftDto,
SearchPaginationItemDto,
ShiftService> {
  constructor(service: ShiftService) {
    super(service,mapItemToResponse);
  }

  
}
