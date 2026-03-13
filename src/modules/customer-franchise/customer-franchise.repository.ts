import { PipelineStage, Types } from "mongoose";
import { BaseRepository, formatItemsQuery, HttpException, HttpStatus, MSG_BUSINESS } from "../../core";
import { ICustomerFranchise } from "./customer-franchise.interface";
import CustomerFranchiseSchema from "./customer-franchise.model";
import { SearchItemDto, SearchPaginationItemDto } from "./dto/search.dto";

export class CustomerFranchiseRepository extends BaseRepository<ICustomerFranchise> {
  constructor() {
    super(CustomerFranchiseSchema);
  }

  public async getItem(id: string) {
    const pipeline: PipelineStage[] = [
      { $match: { _id: new Types.ObjectId(id), is_deleted: false } },
      ...this.buildQueryPipeline({}),
    ];
    const result = await this.model.aggregate(pipeline);
    return result[0] || null;
  }

  public async getItems(model: SearchPaginationItemDto): Promise<{ data: ICustomerFranchise[]; total: number }> {
    const searchCondition = {
      ...new SearchItemDto(),
      ...model.searchCondition,
    };

    const { customer_id, franchise_id, loyalty_points, loyalty_tier, total_earned_points, is_active, is_deleted } =
      searchCondition;
    const { pageNum, pageSize } = model.pageInfo;

    let matchQuery: Record<string, any> = {};

    // common + dynamic filters
    matchQuery = formatItemsQuery(matchQuery, {
      customer_id,
      franchise_id,
      loyalty_tier,
      is_active,
      is_deleted,
    });

    const skip = (pageNum - 1) * pageSize;

    try {
      const pipeline: PipelineStage[] = [...this.buildQueryPipeline(matchQuery)];

      if (pageNum && pageSize) {
        pipeline.push({
          $facet: {
            data: [{ $sort: { created_at: -1 } }, { $skip: skip }, { $limit: pageSize }],
            total: [{ $count: "count" }],
          },
        });
      } else {
        pipeline.push({
          $facet: {
            data: [{ $sort: { created_at: -1 } }],
            total: [{ $count: "count" }],
          },
        });
      }

      const result = await this.model.aggregate(pipeline);

      return {
        data: result[0]?.data || [],
        total: result[0]?.total[0]?.count || 0,
      };
    } catch (error) {
      console.error(error);
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.DATABASE_QUERY_FAILED);
    }
  }

  private buildQueryPipeline(matchQuery: Record<string, any>): PipelineStage[] {
    return [
      { $match: matchQuery },

      // Lookup franchise
      {
        $lookup: {
          from: "franchises",
          localField: "franchise_id",
          foreignField: "_id",
          as: "franchise",
        },
      },

      // Lookup customer
      {
        $lookup: {
          from: "customers",
          localField: "customer_id",
          foreignField: "_id",
          as: "customer",
        },
      },

      { $unwind: { path: "$franchise", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },

      {
        $project: {
          customer_id: 1,
          customer_name: "$customer.name",
          customer_email: "$customer.email",

          franchise_id: 1,
          franchise_name: "$franchise.name",
          franchise_code: "$franchise.code",

          loyalty_points: 1,
          total_earned_points: 1,
          loyalty_tier: 1,
          first_order_date: 1,
          last_order_date: 1,

          is_active: 1,
          is_deleted: 1,
          created_at: 1,
          updated_at: 1,
        },
      },
    ];
  }

  public async getCustomerFranchise(customerId: string, franchiseId: string) {
    return this.model
      .findOne({
        customer_id: customerId,
        franchise_id: franchiseId,
      })
      .lean();
  }

  public async updatePoints(customerFranchiseId: string, pointChange: number) {
    return this.model.findByIdAndUpdate(
      customerFranchiseId,
      {
        $inc: {
          loyalty_points: pointChange,
        },
      },
      { new: true },
    );
  }

  public async increaseStats(customerFranchiseId: string, orderAmount: number) {
    return this.model.findByIdAndUpdate(customerFranchiseId, {
      $inc: {
        total_orders: 1,
        total_spent: orderAmount,
      },
      $set: {
        last_order_date: new Date(),
      },
    });
  }
}
