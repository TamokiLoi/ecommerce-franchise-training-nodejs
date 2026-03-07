import {
  BaseRepository,
  formatItemsQuery,
  HttpException,
  HttpStatus,
  MSG_BUSINESS,
} from "../../core";
import ShiftSchema from "./shift.model";
import { SearchItemDto, SearchPaginationItemDto } from "./dto/search.dto";
import { IShift, IShiftQuery } from "./shift.interface";
import { Types } from "mongoose";
export class ShiftRepository
  extends BaseRepository<IShift>
  implements IShiftQuery
{
  constructor() {
    super(ShiftSchema);
  }

  public async getById(id: string): Promise<IShift | null> {
    return this.findById(id);
  }

  public async getItems(
    model: SearchPaginationItemDto,
  ): Promise<{ data: IShift[]; total: number }> {
    const searchCondition = {
      ...new SearchItemDto(),
      ...model.searchCondition,
    };

    const { name, franchise_id, start_time, end_time, is_active, is_deleted } =
      searchCondition;
    const { pageNum, pageSize } = model.pageInfo;

    let matchQuery: Record<string, any> = {};

    if (franchise_id) {
      matchQuery.franchise_id = new Types.ObjectId(franchise_id);
    }

    if (name?.trim()) {
      matchQuery.name = name.trim();
    }

    if (start_time) {
      matchQuery.start_time = start_time;
    }

    if (end_time) {
      matchQuery.end_time = end_time;
    }

    matchQuery = formatItemsQuery(matchQuery, {
      is_active,
      is_deleted,
    });

    const skip = (pageNum - 1) * pageSize;

    try {
      const result = await this.model.aggregate([
        { $match: matchQuery },
        {
          $lookup: {
            from: "franchises",
            localField: "franchise_id",
            foreignField: "_id",
            as: "franchise",
          },
        },
        {
          $unwind: {
            path: "$franchise",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            franchise_name: "$franchise.name",
          },
        },
        {
          $project: {
            franchise: 0,
          },
        },
        {
          $facet: {
            data: [
              { $sort: { created_at: -1 } },
              { $skip: skip },
              { $limit: pageSize },
            ],
            total: [{ $count: "count" }],
          },
        },
      ]);

      return {
        data: result[0].data,
        total: result[0].total[0]?.count || 0,
      };
    } catch (error) {
      throw new HttpException(
        HttpStatus.BadRequest,
        MSG_BUSINESS.DATABASE_QUERY_FAILED,
      );
    }
  }

  public async getShiftsByFranchise(franchiseId: string): Promise<IShift[]> {
    return this.model
      .find({
        franchise_id: new Types.ObjectId(franchiseId),
        is_active: true,
        is_deleted: false,
      })
      .sort({ name: 1 })
      .lean() as unknown as IShift[];
  }

  public async getFranchiseIdbyShiftId(id: string): Promise<string | null> {
    const shift = await this.model
      .findById(id)
      .select("franchise_id")
      .lean() as unknown as IShift;
    return shift?.franchise_id?.toString();
  }
}
