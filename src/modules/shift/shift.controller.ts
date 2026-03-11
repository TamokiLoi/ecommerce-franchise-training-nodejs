import { NextFunction, Request, Response } from "express";
import { AuthenticatedUserRequest, BaseCrudController, formatResponse, HttpStatus } from "../../core";
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
UpdateShiftDto,
SearchPaginationItemDto,
ShiftItemDto,
ShiftService> {
  constructor(service: ShiftService) {
    super(service,mapItemToResponse);
  }

  public changeStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.service.changeStatus(id, req.body, (req as AuthenticatedUserRequest)?.user?.id || "");
      res.status(HttpStatus.Success).json(formatResponse<null>(null));
    } catch (error) {
      next(error);
    }
  };

  public getAllShifts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { franchise_id } = req.query;
      const shifts = franchise_id 
        ? await this.service.getAllShiftsByFranchise(String(franchise_id))
        : await this.service.getAllShifts();
        
      const data = shifts.map((s) => ({ 
        value: String(s._id), 
        name: `${s.name} (${s.start_time} - ${s.end_time})`,
        franchise_id: s.franchise_id?.toString()
      }));
      res.status(HttpStatus.Success).json(formatResponse(data));
    } catch (error) {
      next(error);
    }
  };
}
