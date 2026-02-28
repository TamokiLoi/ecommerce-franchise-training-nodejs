import { BaseCrudService } from "../../core";
import { IShift } from "./shift.interface";
import CreateShiftDto from "./dto/create.dto";
import UpdateShiftDto from "./dto/update.dto";
import {SearchItemDto} from "./dto/search.dto";
import { ShiftRepository } from "./shift.repository";
export class ShiftService extends BaseCrudService<IShift, CreateShiftDto, UpdateShiftDto, SearchItemDto> {
  private readonly shiftRepo: ShiftRepository;
  constructor(repo:ShiftRepository) {
    super(repo);
    this.shiftRepo = repo;
  }

  protected async doSearch(searchDto: SearchItemDto): Promise<{ data: IShift[]; total: number }> {
    return this.shiftRepo.getItems(searchDto);
  }

}
