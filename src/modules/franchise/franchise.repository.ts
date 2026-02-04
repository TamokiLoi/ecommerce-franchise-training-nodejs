import { HttpStatus } from "../../core/enums";
import { HttpException } from "../../core/exceptions";
import { BaseRepository } from "../../core/repository";
import { formatItemsQuery } from "../../core/utils";
import { SearchItemDto, SearchPaginationItemDto } from "./dto/search.dto";
import { IFranchise } from "./franchise.interface";
import FranchiseSchema from "./franchise.model";

export class FranchiseRepository extends BaseRepository<IFranchise> {
  private franchiseSchema = FranchiseSchema;
  constructor() {
    super(FranchiseSchema);
  }

  public async getItems(model: SearchPaginationItemDto): Promise<{ data: IFranchise[]; total: number }> {
    const searchCondition = {
      ...new SearchItemDto(),
      ...model.searchCondition,
    };

    const { keyword, opened_at, closed_at, is_active, is_deleted } = searchCondition;
    const { pageNum, pageSize } = model.pageInfo;

    let matchQuery: Record<string, any> = {};

    // keyword search
    if (keyword?.trim()) {
      matchQuery.$or = [
        { code: { $regex: keyword.trim(), $options: "i" } },
        { name: { $regex: keyword.trim(), $options: "i" } },
      ];
    }

    // time filter (convert to minutes)
    if (opened_at) {
      matchQuery.opened_at = { $gte: opened_at };
    }

    if (closed_at) {
      matchQuery.closed_at = { $lte: closed_at };
    }

    // common filters
    matchQuery = formatItemsQuery(matchQuery, { is_active, is_deleted });

    const skip = (pageNum - 1) * pageSize;

    try {
      const result = await this.franchiseSchema.aggregate([
        { $match: matchQuery },
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
      throw new HttpException(HttpStatus.BadRequest, "Database query failed");
    }
  }
}
