import { ClientSession, Types } from "mongoose";
import { BaseRepository, formatItemsQuery, HttpException, HttpStatus, MSG_BUSINESS } from "../../core";
import { SearchItemDto, SearchPaginationItemDto } from "./dto/search.dto";
import { IInventory } from "./inventory.interface";
import InventorySchema from "./inventory.model";

export class InventoryRepository extends BaseRepository<IInventory> {
  constructor() {
    super(InventorySchema);
  }

  public async getItems(model: SearchPaginationItemDto): Promise<{ data: IInventory[]; total: number }> {
    const searchCondition = { ...new SearchItemDto(), ...model.searchCondition };

    const { product_franchise_id, franchise_id, product_id, is_active, is_deleted } = searchCondition;

    const { pageNum, pageSize } = model.pageInfo;

    const skip = (pageNum - 1) * pageSize;

    let matchQuery: Record<string, any> = {};

    if (product_franchise_id) {
      matchQuery.product_franchise_id = new Types.ObjectId(product_franchise_id);
    }

    matchQuery = formatItemsQuery(matchQuery, { is_active, is_deleted });

    try {
      const result = await this.model.aggregate([
        { $match: matchQuery },

        // 🔹 JOIN product_franchise
        {
          $lookup: {
            from: "productfranchises",
            localField: "product_franchise_id",
            foreignField: "_id",
            as: "product_franchise",
          },
        },
        { $unwind: "$product_franchise" },

        // 🔹 FILTER franchise if provided
        ...(franchise_id
          ? [
              {
                $match: {
                  "product_franchise.franchise_id": new Types.ObjectId(franchise_id),
                },
              },
            ]
          : []),

        // 🔹 FILTER product if provided
        ...(product_id
          ? [
              {
                $match: {
                  "product_franchise.product_id": new Types.ObjectId(product_id),
                },
              },
            ]
          : []),

        // 🔹 JOIN product
        {
          $lookup: {
            from: "products",
            localField: "product_franchise.product_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },

        // 🔹 JOIN franchise
        {
          $lookup: {
            from: "franchises",
            localField: "product_franchise.franchise_id",
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
                  product_franchise_id: 1,
                  quantity: 1,
                  reserved_quantity: 1,
                  alert_threshold: 1,
                  is_active: 1,
                  created_at: 1,
                  updated_at: 1,

                  product_id: "$product_franchise.product_id",
                  product_name: "$product.name",
                  franchise_id: "$product_franchise.franchise_id",
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

  // Find inventory by product_franchise_id
  public async findByProductFranchiseId(
    productFranchiseId: string,
    session?: ClientSession,
  ): Promise<IInventory | null> {
    return this.model.findOne({ product_franchise_id: productFranchiseId }, null, { session });
  }

  // Reserve stock for an order
  public async reserveStock(productFranchiseId: string, quantity: number, session?: ClientSession): Promise<boolean> {
    const result = await this.model.updateOne(
      {
        product_franchise_id: productFranchiseId,
        $expr: {
          $gte: [{ $subtract: ["$quantity", "$reserved_quantity"] }, quantity],
        },
      },
      {
        $inc: { reserved_quantity: quantity },
      },
      { session },
    );

    return result.modifiedCount > 0;
  }

  // Release reserved stock (e.g., when an order is canceled)
  public async releaseStock(productFranchiseId: string, quantity: number, session?: ClientSession) {
    await this.model.updateOne(
      {
        product_franchise_id: productFranchiseId,
        reserved_quantity: { $gte: quantity },
      },
      {
        $inc: { reserved_quantity: -quantity },
      },
      { session },
    );
  }

  // Deduct stock when an order is COMPLETED
  public async deductStock(productFranchiseId: string, quantity: number, session?: ClientSession) {
    await this.model.updateOne(
      {
        product_franchise_id: productFranchiseId,
        quantity: { $gte: quantity },
        reserved_quantity: { $gte: quantity },
      },
      {
        $inc: {
          quantity: -quantity,
          reserved_quantity: -quantity,
        },
      },
      { session },
    );
  }

  // Adjust stock (increase or decrease) for inventory management
  public async adjustStock(productFranchiseId: string, change: number, session?: ClientSession): Promise<boolean> {
    const result = await this.model.updateOne(
      {
        product_franchise_id: productFranchiseId,
        ...(change < 0 && { quantity: { $gte: Math.abs(change) } }),
      },
      {
        $inc: { quantity: change },
      },
      { session },
    );

    return result.modifiedCount > 0;
  }

  // Find inventories with low stock (quantity - reserved_quantity <= alert_threshold) -> support for dashboard
  public async findLowStock(franchiseId?: string): Promise<IInventory[]> {
    const pipeline: any[] = [
      {
        $lookup: {
          from: "productfranchises",
          localField: "product_franchise_id",
          foreignField: "_id",
          as: "product_franchise",
        },
      },
      { $unwind: "$product_franchise" },
    ];

    if (franchiseId) {
      pipeline.push({
        $match: {
          "product_franchise.franchise_id": new Types.ObjectId(franchiseId),
        },
      });
    }

    pipeline.push({
      $match: {
        $expr: {
          $lte: [{ $subtract: ["$quantity", "$reserved_quantity"] }, "$alert_threshold"],
        },
      },
    });

    return this.model.aggregate(pipeline);
  }
}
