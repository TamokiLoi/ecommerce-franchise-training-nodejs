import { Types } from "mongoose";
import { BaseRepository } from "../../core/repository";
import { formatItemsQuery } from "../../core/utils";
import { SearchPaginationItemDto } from "./dto/search.dto";
import { IPromotion } from "./promotion.interface";
import PromotionSchema from "./promotion.model";

export class PromotionRepository extends BaseRepository<IPromotion> {
  constructor() {
    super(PromotionSchema);
  }

  public async getItem(id: string): Promise<IPromotion | null> {
    const pipeline = this.buildPromotionAggregate({
      _id: new Types.ObjectId(id),
      is_deleted: false,
    });

    const result = await this.model.aggregate(pipeline);

    return result[0] || null;
  }

  public async getItems(model: SearchPaginationItemDto): Promise<{ data: IPromotion[]; total: number }> {
    const { franchise_id, product_franchise_id, type, value, start_date, end_date, is_active, is_deleted } =
      model.searchCondition;

    const { pageNum, pageSize } = model.pageInfo;

    let query: Record<string, any> = {};

    if (franchise_id) query.franchise_id = franchise_id;
    if (product_franchise_id) query.product_franchise_id = product_franchise_id;
    if (type) query.type = type;
    if (value !== undefined) query.value = value;

    // promotion overlap filter
    if (start_date || end_date) {
      query.$and = [];

      if (start_date) {
        query.$and.push({ end_date: { $gte: new Date(start_date) } });
      }

      if (end_date) {
        query.$and.push({ start_date: { $lte: new Date(end_date) } });
      }
    }

    query = formatItemsQuery(query, { is_active, is_deleted });

    const skip = (pageNum - 1) * pageSize;

    const pipeline = this.buildPromotionAggregate(query);

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
      data: result[0].data,
      total: result[0].total[0]?.count || 0,
    };
  }

  private buildPromotionAggregate(matchQuery: Record<string, any>) {
    return [
      { $match: matchQuery },

      // 🔹 JOIN Franchise
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

      // 🔹 JOIN Product
      {
        $lookup: {
          from: "products",
          localField: "product_id",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: {
          path: "$product",
          preserveNullAndEmptyArrays: true,
        },
      },

      // 🔹 OUTPUT MAPPING
      {
        $project: {
          _id: 1,
          franchise_id: 1,
          product_id: 1,
          type: 1,
          value: 1,
          start_date: 1,
          end_date: 1,
          is_active: 1,
          is_deleted: 1,
          created_at: 1,
          updated_at: 1,

          id: "$_id",
          franchise_name: "$franchise.name",
          product_name: "$product.name",
        },
      },
    ];
  }
}
