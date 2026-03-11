import { Types } from "mongoose";
import { MSG_BUSINESS } from "../../core/constants";
import { HttpStatus } from "../../core/enums";
import { HttpException } from "../../core/exceptions";
import { BaseRepository } from "../../core/repository";
import { formatItemsQuery } from "../../core/utils";
import { SearchItemDto, SearchPaginationItemDto } from "./dto/search.dto";
import { IVoucher } from "./voucher.interface";
import VoucherSchema from "./voucher.model";

export class VoucherRepository extends BaseRepository<IVoucher> {
  constructor() {
    super(VoucherSchema);
  }

  public async getItem(id: string): Promise<IVoucher | null> {
    return this.model
      .findOne({
        _id: new Types.ObjectId(id),
        is_deleted: false,
      })
      .exec();
  }

  public async getItems(model: SearchPaginationItemDto): Promise<{ data: IVoucher[]; total: number }> {
    const searchCondition = {
      ...new SearchItemDto(),
      ...model.searchCondition,
    } as any;

    const { code, franchise_id, product_franchise_id, type, start_date, end_date, is_active, is_deleted } =
      searchCondition;

    const { pageNum, pageSize } = model.pageInfo;

    let conditions: Record<string, any> = {};

    if (code) conditions.code = code;

    if (franchise_id && Types.ObjectId.isValid(franchise_id))
      conditions.franchise_id = new Types.ObjectId(franchise_id);

    if (product_franchise_id && Types.ObjectId.isValid(product_franchise_id))
      conditions.product_franchise_id = new Types.ObjectId(product_franchise_id);

    if (type) conditions.type = type;

    if (start_date) {
      conditions.end_date = { $gte: new Date(start_date) };
    }

    if (end_date) {
      conditions.start_date = conditions.start_date || {};
      conditions.start_date.$lte = new Date(end_date);
    }

    conditions = formatItemsQuery(conditions, { is_active, is_deleted });

    const skip = (pageNum - 1) * pageSize;

    try {
      const pipeline = this.buildVoucherAggregate(conditions);

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
    } catch (error) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.DATABASE_QUERY_FAILED);
    }
  }

  private buildVoucherAggregate(matchQuery: Record<string, any>) {
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

      // 🔹 JOIN ProductFranchise
      {
        $lookup: {
          from: "productfranchises",
          localField: "product_franchise_id",
          foreignField: "_id",
          as: "productFranchise",
        },
      },
      {
        $unwind: {
          path: "$productFranchise",
          preserveNullAndEmptyArrays: true,
        },
      },

      // 🔹 JOIN Product
      {
        $lookup: {
          from: "products",
          localField: "productFranchise.product_id",
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

      // 🔹 MAP OUTPUT
      {
        $project: {
          _id: 1,
          code: 1,
          name: 1,
          description: 1,
          franchise_id: 1,
          product_franchise_id: 1,
          type: 1,
          value: 1,
          quota_total: 1,
          quota_used: 1,
          start_date: 1,
          end_date: 1,
          is_active: 1,
          is_deleted: 1,
          created_at: 1,
          updated_at: 1,

          id: "$_id",

          franchise_name: "$franchise.name",

          product_id: "$product._id",
          product_name: "$product.name",
        },
      },
    ];
  }
}
