import { Types } from "mongoose";
import { BaseRepository, formatItemsQuery, HttpException, HttpStatus, MSG_BUSINESS } from "../../core";
import { CreateShiftAssignmentDto } from "./dto/create.dto";
import { SearchItemDto, SearchPaginationItemDto } from "./dto/search.dto";
import { IShiftAssignment, IShiftAssignmentQuery } from "./shift-assignment.interface";
import ShiftAssignmentSchema from "./shift-assignment.model";

export class ShiftAssignmentRepository extends BaseRepository<IShiftAssignment> {
  constructor() {
    super(ShiftAssignmentSchema);
  }

  public async getById(id: string): Promise<IShiftAssignment | null> {
    return this.findById(id);
  }

  public async getItem(id: string): Promise<IShiftAssignment | null> {
    const pipeline = this.buildShiftAssignmentAggregate({
      _id: new Types.ObjectId(id),
      is_deleted: false,
    });

    const result = await this.model.aggregate(pipeline);

    return result[0] || null;
  }

  public async doSearch(model: SearchPaginationItemDto): Promise<{ data: IShiftAssignment[]; total: number }> {
    const searchCondition = {
      ...new SearchItemDto(),
      ...model.searchCondition,
    };

    const { shift_id, user_id, work_date, assigned_by, status, is_deleted } = searchCondition;

    const { pageNum = 1, pageSize = 10 } = model.pageInfo;

    let matchQuery: Record<string, any> = {};

    if (shift_id && Types.ObjectId.isValid(shift_id)) {
      matchQuery.shift_id = new Types.ObjectId(shift_id);
    }

    if (user_id && Types.ObjectId.isValid(user_id)) {
      matchQuery.user_id = new Types.ObjectId(user_id);
    }

    if (work_date) {
      matchQuery.work_date = work_date;
    }

    if (assigned_by && Types.ObjectId.isValid(assigned_by)) {
      matchQuery.assigned_by = new Types.ObjectId(assigned_by);
    }

    if (status) {
      matchQuery.status = status;
    }

    matchQuery = formatItemsQuery(matchQuery, {
      is_deleted: is_deleted ?? false,
    });

    const skip = (pageNum - 1) * pageSize;

    try {
      const pipeline = this.buildShiftAssignmentAggregate(matchQuery);

      const result = await this.model.aggregate([
        ...pipeline,
        {
          $facet: {
            data: [{ $sort: { created_at: -1 } }, { $skip: skip }, { $limit: pageSize }],
            total: [{ $count: "count" }],
          },
        },
      ]);

      return {
        data: result[0]?.data ?? [],
        total: result[0]?.total?.[0]?.count ?? 0,
      };
    } catch (error) {
      throw new HttpException(HttpStatus.BAD_REQUEST, MSG_BUSINESS.DATABASE_QUERY_FAILED);
    }
  }

  public async getItemByShiftId(shiftId: string): Promise<IShiftAssignment | null> {
    const matchQuery = {
      shift_id: new Types.ObjectId(shiftId),
      is_deleted: false,
    };

    const pipeline = this.buildShiftAssignmentAggregate(matchQuery);

    const result = await this.model.aggregate([...pipeline, { $limit: 1 }]);

    return result[0] || null;
  }

  public async getAllByUserIdAndDate(userId: string, work_date?: string): Promise<IShiftAssignment[]> {
    const matchQuery: any = {
      user_id: new Types.ObjectId(userId),
      is_deleted: false,
    };

    if (work_date) {
      matchQuery.work_date = work_date;
    }

    const pipeline = this.buildShiftAssignmentAggregate(matchQuery);

    return this.model.aggregate(pipeline);
  }

  public async getAllByShiftIdAndDate(shiftId: string, work_date?: string): Promise<IShiftAssignment[]> {
    const matchQuery: any = {
      shift_id: new Types.ObjectId(shiftId),
      is_deleted: false,
    };

    if (work_date) {
      matchQuery.work_date = work_date;
    }

    const pipeline = this.buildShiftAssignmentAggregate(matchQuery);

    return this.model.aggregate(pipeline);
  }

  public async getAllByFranchiseIdAndDate(franchiseId: string, work_date?: string): Promise<IShiftAssignment[]> {
    const matchQuery: any = {
      "shift.franchise_id": new Types.ObjectId(franchiseId),
      is_deleted: false,
    };

    if (work_date) {
      matchQuery.work_date = work_date;
    }

    const pipeline = [
      {
        $lookup: {
          from: "shifts",
          localField: "shift_id",
          foreignField: "_id",
          as: "shift",
        },
      },
      { $unwind: "$shift" },

      { $match: matchQuery },

      // reuse common pipeline
      ...this.buildShiftAssignmentAggregate({}),
    ];

    return this.model.aggregate(pipeline);
  }

  public async getByUserId(userId: string): Promise<IShiftAssignment | null> {
    return this.model.findOne({ user_id: new Types.ObjectId(userId) });
  }

  public async createItems(items: CreateShiftAssignmentDto[], loggedUserId: string): Promise<IShiftAssignment[]> {
    const data: Partial<IShiftAssignment>[] = items.map((item) => ({
      shift_id: new Types.ObjectId(item.shift_id),
      user_id: new Types.ObjectId(item.user_id),
      work_date: item.work_date,
      assigned_by: new Types.ObjectId(loggedUserId),
    }));

    return this.insertMany(data);
  }

  public async createItem(item: CreateShiftAssignmentDto, loggedUserId: string): Promise<IShiftAssignment> {
    const data: Partial<IShiftAssignment> = {
      shift_id: new Types.ObjectId(item.shift_id),
      user_id: new Types.ObjectId(item.user_id),
      work_date: item.work_date,
      assigned_by: new Types.ObjectId(loggedUserId),
    };

    return this.create(data);
  }

  private buildShiftAssignmentAggregate(matchQuery: Record<string, any>) {
    return [
      { $match: matchQuery },

      // join shift
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

      // join user
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },

      // output mapping
      {
        $project: {
          _id: 1,
          shift_id: 1,
          user_id: 1,
          note: 1,
          work_date: 1,
          assigned_by: 1,
          status: 1,
          is_deleted: 1,
          created_at: 1,
          updated_at: 1,

          id: "$_id",
          user_name: "$user.name",
          start_time: "$shift.start_time",
          end_time: "$shift.end_time",
        },
      },
    ];
  }
}
