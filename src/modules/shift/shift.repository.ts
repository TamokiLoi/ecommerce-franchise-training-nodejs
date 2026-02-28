import { BaseRepository, formatItemsQuery, HttpException, HttpStatus, MSG_BUSINESS } from "../../core";
import { IShift } from "./shift.interface";
import ShiftSchema from "./shift.model";
import { SearchItemDto,SearchPaginationItemDto } from "./dto/search.dto";


export class ShiftRepository extends BaseRepository<IShift> {
  constructor() {
    super(ShiftSchema);
  }

  public async getItems (model:SearchPaginationItemDto): Promise<{ data: IShift[]; total: number }> {
    const searchCondition = {
          ...new SearchItemDto(),
          ...model.searchCondition,
        };

    const {keyword,franshise_id,is_active,is_deleted} = searchCondition;
    const {pageNum,pageSize} = model.pageInfo;

    let matchQuery: Record<string, any> = {};

    if(keyword?.trim()) {
      matchQuery.$or = [
        {code: {$regex: keyword.trim(), $options: "i"}},
        {name: {$regex: keyword.trim(), $options: "i"}},
      ]
    }

    if(franshise_id) {
      matchQuery.franshise_id = franshise_id;
    }

    matchQuery = formatItemsQuery(matchQuery, {is_active, is_deleted});

    const skip = (pageNum - 1) * pageSize;

    try {
      const result = await this.model.aggregate([
        {$match: matchQuery},
        {
          $lookup: {
            from: "franshises",
            localField: "franshise_id",
            foreignField: "_id",
            as: "franshise",
          },
        },
        {
          $unwind: {
            path: "$franshise",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            franshise_name: "$franshise.name",
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

}
