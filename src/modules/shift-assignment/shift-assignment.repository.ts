import {
  BaseRepository,
  formatItemsQuery,
  HttpException,
  HttpStatus,
  MSG_BUSINESS,
} from "../../core";
import ShiftAssignmentSchema from "./shift-assignment.model";
import {
  IShiftAssignment,
  IShiftAssignmentQuery,
} from "./shift-assignment.interface";
import { SearchItemDto, SearchPaginationItemDto } from "./dto/search.dto";
import { Date, Types } from "mongoose";
import { CreateShiftAssignmentDto } from "./dto/create.dto";


export class ShiftAssignmentRepository extends BaseRepository<IShiftAssignment> implements IShiftAssignmentQuery
{
  constructor() {
    super(ShiftAssignmentSchema);
  }

  public async getById(id: string): Promise<IShiftAssignment | null> {
    return this.findById(id);
  }

  public async doSearch(model: SearchPaginationItemDto): Promise<{ data: IShiftAssignment[]; total: number }> {
    const searchCondition={
      ...new SearchItemDto(),
      ...model.searchCondition,
    }
    const {shift_id,user_id,work_date,assigned_by,status,is_deleted} = searchCondition;
    const {pageNum,pageSize} = model.pageInfo;
    let matchQuery: Record<string, any> = {};
    if (shift_id && Types.ObjectId.isValid(shift_id)) {
      matchQuery.shift_id = new Types.ObjectId(shift_id);
    }
    if (user_id && Types.ObjectId.isValid(user_id)) {
      matchQuery.user_id = new Types.ObjectId(user_id);
    }
    if(work_date) {
      matchQuery.work_date = work_date;
    }
    if (assigned_by && Types.ObjectId.isValid(assigned_by)) {
      matchQuery.assigned_by = new Types.ObjectId(assigned_by);
    }
    if(status) {
      matchQuery.status = status;
    }
    matchQuery = formatItemsQuery(matchQuery, { is_deleted: is_deleted ?? false });
    const skip = (pageNum - 1) * pageSize;
    try {
      const result = await this.model.aggregate([
        {$match: matchQuery},
        {
          $lookup: {
            from: "shifts",
            localField: "shift_id",
            foreignField: "_id",
            as: "shift",
          },
        },
        {
          $unwind: {
            path: "$shift",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            shift_name: "$shift.name",
          },
        },
        {
          $project: {
            shift: 0,
          },
        },
        {
          $facet: {
            data: [{ $sort: { created_at: -1 } }, { $skip: skip }, { $limit: pageSize }],
            total: [{ $count: "count" }],
          },
        },
      ]);
      return {
        data: result[0].data,
        total: result[0].total[0]?.count || 0,
      };
    } catch (error) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.DATABASE_QUERY_FAILED);
    }

  }
  
  public async getAllShiftAssignmentsByUserIdAndDate(
    userId: string,
    work_date: string,
  ): Promise<IShiftAssignment[]> {
    console.log("QUERY USER:", userId);
    console.log("QUERY DATE:", work_date);
    if(work_date){
      return this.model.find({
        user_id: new Types.ObjectId(userId),
        work_date: new Date(work_date),
      });
    }else{
      return this.model.find({
        user_id: new Types.ObjectId(userId),
      });
    }
  }

  public async getByUserId(userId: string): Promise<IShiftAssignment | null> {
    return this.model.findOne({ user_id: new Types.ObjectId(userId) });
  }

  public async getAllShiftAssignmentsByFranchiseIdandDate(franchiseId: string,date:string): Promise<IShiftAssignment[]> {
    if(date){
      return this.model.find({
        franchise_id: new Types.ObjectId(franchiseId),
        work_date: new Date(date),
      });
    }else{
      return this.model.find({
        franchise_id: new Types.ObjectId(franchiseId),
      });
    }
  }

  public async createItems(items: CreateShiftAssignmentDto[],loggedUserId:string): Promise<IShiftAssignment[]> {
    const data: Partial<IShiftAssignment>[] = items.map((item) => ({
      shift_id: new Types.ObjectId(item.shift_id),
      user_id: new Types.ObjectId(item.user_id),
      work_date: item.work_date,
      assigned_by: new Types.ObjectId(loggedUserId),
    }));

    return this.insertMany(data);
  }

  public async createItem(item: CreateShiftAssignmentDto,loggedUserId:string): Promise<IShiftAssignment> {
    const data: Partial<IShiftAssignment> = {
      shift_id: new Types.ObjectId(item.shift_id),
      user_id: new Types.ObjectId(item.user_id),
      work_date: item.work_date,
      assigned_by: new Types.ObjectId(loggedUserId),
    };

    return this.create(data);
  }

  public async getShiftAssignementByShiftId(shiftId: string): Promise<IShiftAssignment | null> {
    return this.model.findOne({ shift_id: new Types.ObjectId(shiftId) });
  }

    public async getShiftAssignementsByShiftId(
    shiftId: string
  ): Promise<IShiftAssignment[] | null> {

    const result = await this.find({ shift_id: shiftId });

    if (!result) {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        "Shift assignment not found"
      );
    }

    return result;
  }
}
