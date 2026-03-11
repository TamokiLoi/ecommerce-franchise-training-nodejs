import { NextFunction, Request, Response } from "express";
import {
    AuthenticatedUserRequest,
    BaseCrudController,
    formatResponse,
    HttpStatus
} from "../../core";
import { CreateShiftAssignmentDto, CreateShiftAssignmentItemsDto } from "./dto/create.dto";
import { ShiftAssignmentItemDto } from "./dto/item.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import { UpdateStatusDto } from "./dto/update.dto";
import { IShiftAssignment } from "./shift-assignment.interface";
import { mapItemToResponse } from "./shift-assignment.mapper";
import { ShiftAssignmentService } from "./shift-assignment.service";

export class ShiftAssignmentController extends BaseCrudController<
  IShiftAssignment,
  CreateShiftAssignmentDto,
  UpdateStatusDto,
  SearchPaginationItemDto,
  ShiftAssignmentItemDto,
  ShiftAssignmentService
> {
  constructor(service: ShiftAssignmentService) {
    super(service, mapItemToResponse);
  }

//   public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     try {
//       const { id } = req.params;
//       const item = await this.service.getById(id);
//       if (!item) {
//         throw new HttpException(HttpStatus.NotFound, MSG_BUSINESS.ITEM_NOT_FOUND);
//       }
//       res.status(HttpStatus.Success).json(formatResponse(mapItemToResponse(item)));
//     } catch (error) {
//       next(error);
//     }
//   };

  public changeStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const model: UpdateStatusDto = req.body;

      await this.service.changeStatus(id, model, (req as AuthenticatedUserRequest).user?.id || "");
      res.status(HttpStatus.Success).json(formatResponse<null>(null));
    } catch (error) {
      next(error);
    }
  };

//   public createItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     try {
//       const model: CreateShiftAssignmentDto = req.body;
//       const loggedUserId = (req as AuthenticatedUserRequest).user?.id || "";

//       const createdItem = await this.service.createItem(model, loggedUserId);

//       res.status(HttpStatus.Success).json(formatResponse(mapItemToResponse(createdItem)));
//     } catch (error) {
//       next(error);
//     }
//   };

  public createItems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as CreateShiftAssignmentItemsDto;

      const loggedUserId = (req as AuthenticatedUserRequest).user?.id || "";

      const createdItems = await this.service.createItems(body.items, loggedUserId);

      res.status(HttpStatus.Success).json(formatResponse(createdItems.map((item) => mapItemToResponse(item))));
    } catch (error) {
      next(error);
    }
  };

  public getShiftAssignmentByUserId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { date } = req.query;
      const items = await this.service.getAllByUserIdAndDate(userId, date as string);
      res.status(HttpStatus.Success).json(formatResponse(items.map(mapItemToResponse)));
    } catch (error) {
      next(error);
    }
  };

  public getAllByFranchiseIdAndDate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { franchiseId } = req.params;
      const { date } = req.query;
      const items = await this.service.getAllByFranchiseIdAndDate(franchiseId, date as string);
      res.status(HttpStatus.Success).json(formatResponse(items.map(mapItemToResponse)));
    } catch (error) {
      next(error);
    }
  };

  public getAllByShiftIdAndDate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { shiftId } = req.params;
            const { date } = req.query;
      const items = await this.service.getAllByShiftIdAndDate(shiftId, date as string);
      res.status(HttpStatus.Success).json(formatResponse(items));
    } catch (error) {
      next(error);
    }
  };
}
