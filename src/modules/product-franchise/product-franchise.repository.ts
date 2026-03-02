import { MSG_BUSINESS } from "../../core/constants";
import { HttpStatus } from "../../core/enums";
import { HttpException } from "../../core/exceptions";
import { BaseRepository } from "../../core/repository";
import { formatItemsQuery } from "../../core/utils";
import { SearchItemDto, SearchPaginationItemDto } from "./dto/search.dto";
import { IProductFranchise } from "./product-franchise.interface";
import ProductFranchiseSchema from "./product-franchise.model";

export class ProductFranchiseRepository extends BaseRepository<IProductFranchise> {
  constructor() {
    super(ProductFranchiseSchema);
  }

  // check if a product is already assigned to a franchise
  public async findByProductFranchiseAndSize(
    productId: string,
    franchiseId: string,
    size: string | null,
    options?: { excludeId?: string },
  ): Promise<IProductFranchise | null> {
    const query: any = {
      product_id: productId,
      franchise_id: franchiseId,
      size: size ?? null,
      is_deleted: false,
    };

    if (options?.excludeId) {
      query._id = { $ne: options.excludeId };
    }

    return this.model.findOne(query);
  }

  // A: CRUD methods...
  public async getItems(model: SearchPaginationItemDto): Promise<{ data: IProductFranchise[]; total: number }> {
    const searchCondition = { ...new SearchItemDto(), ...model.searchCondition };

    const { product_id, franchise_id, size, price_from, price_to, is_active, is_deleted } = searchCondition;

    const { pageNum, pageSize } = model.pageInfo;

    let matchQuery: Record<string, any> = {};

    // 1. Filter by product_id
    if (product_id) {
      matchQuery.product_id = product_id;
    }

    // 2. Filter by franchise_id
    if (franchise_id) {
      matchQuery.franchise_id = franchise_id;
    }

    // 3. Filter by size (string, exact or regex)
    if (size?.trim()) {
      matchQuery.size = new RegExp(`^${size.trim()}$`, "i");
    }

    // 4. Price range filter
    if (price_from !== undefined || price_to !== undefined) {
      matchQuery.price_base = {};
      if (price_from !== undefined) matchQuery.price_base.$gte = price_from;
      if (price_to !== undefined) matchQuery.price_base.$lte = price_to;
    }

    // 5. Common filters
    matchQuery = formatItemsQuery(matchQuery, { is_active, is_deleted });

    const skip = (pageNum - 1) * pageSize;

    try {
      const result = await this.model.aggregate([
        { $match: matchQuery },

        // 🔹 JOIN PRODUCT
        {
          $lookup: {
            from: "products",
            localField: "product_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },

        // 🔹 JOIN FRANCHISE
        {
          $lookup: {
            from: "franchises",
            localField: "franchise_id",
            foreignField: "_id",
            as: "franchise",
          },
        },
        { $unwind: "$franchise" },

        {
          $facet: {
            data: [
              { $sort: { created_at: -1 } },
              { $skip: skip },
              { $limit: pageSize },
              {
                $project: {
                  _id: 1,
                  product_id: 1,
                  franchise_id: 1,
                  size: 1,
                  price_base: 1,
                  is_active: 1,
                  is_deleted: 1,
                  created_at: 1,
                  updated_at: 1,

                  // 🔥 add fields
                  product_name: "$product.name",
                  franchise_name: "$franchise.name",
                },
              },
            ],
            total: [{ $count: "count" }],
          },
        },
      ]);

      return {
        data: result[0]?.data || [],
        total: result[0]?.total[0]?.count || 0,
      };
    } catch (error) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.DATABASE_QUERY_FAILED);
    }
  }

  // TODO: do after
  // B: Business / Menu
}
