import { ClientSession, PipelineStage, Types } from "mongoose";
import { BaseRepository, formatItemsQuery, HttpException, HttpStatus, MSG_BUSINESS } from "../../core";
import { SearchItemDto, SearchPaginationItemDto } from "./dto/search.dto";
import { IProductCategoryFranchise } from "./product-category-franchise.interface";
import ProductCategoryFranchiseSchema from "./product-category-franchise.model";
import { PublicProductFranchiseItemDto } from "../product-franchise/dto/item.dto";

export class ProductCategoryFranchiseRepository extends BaseRepository<IProductCategoryFranchise> {
  constructor() {
    super(ProductCategoryFranchiseSchema);
  }

  public async getItems(model: SearchPaginationItemDto): Promise<{ data: IProductCategoryFranchise[]; total: number }> {
    const searchCondition = { ...new SearchItemDto(), ...model.searchCondition };
    const { franchise_id, product_id, category_id, is_active, is_deleted } = searchCondition;
    const { pageNum = 1, pageSize = 10 } = model.pageInfo;

    const skip = (pageNum - 1) * pageSize;

    // 🔹 1. Base match (mapping table only)
    let baseMatch: Record<string, any> = {};
    baseMatch = formatItemsQuery(baseMatch, { is_active, is_deleted });

    // 🔹 2. Extra match after joins
    let joinMatch: Record<string, any> = {};

    if (franchise_id) {
      joinMatch["categoryFranchise.franchise_id"] = new Types.ObjectId(franchise_id);
    }

    if (product_id) {
      joinMatch["product._id"] = new Types.ObjectId(product_id);
    }

    if (category_id) {
      joinMatch["category._id"] = new Types.ObjectId(category_id);
    }

    try {
      const result = await this.model.aggregate([
        { $match: baseMatch },

        // JOIN CategoryFranchise
        {
          $lookup: {
            from: "categoryfranchises",
            localField: "category_franchise_id",
            foreignField: "_id",
            as: "categoryFranchise",
          },
        },
        { $unwind: "$categoryFranchise" },

        // JOIN Franchise
        {
          $lookup: {
            from: "franchises",
            localField: "categoryFranchise.franchise_id",
            foreignField: "_id",
            as: "franchise",
          },
        },
        { $unwind: "$franchise" },

        // JOIN ProductFranchise
        {
          $lookup: {
            from: "productfranchises",
            localField: "product_franchise_id",
            foreignField: "_id",
            as: "productFranchise",
          },
        },
        { $unwind: "$productFranchise" },

        // JOIN Product
        {
          $lookup: {
            from: "products",
            localField: "productFranchise.product_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },

        // JOIN Category
        {
          $lookup: {
            from: "categories",
            localField: "categoryFranchise.category_id",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: "$category" },

        ...(Object.keys(joinMatch).length ? [{ $match: joinMatch }] : []),

        {
          $facet: {
            data: [
              { $sort: { display_order: 1, created_at: -1 } },
              { $skip: skip },
              { $limit: pageSize },
              {
                $project: {
                  _id: 1,
                  category_franchise_id: 1,
                  product_franchise_id: 1,
                  display_order: 1,
                  is_active: 1,
                  is_deleted: 1,
                  created_at: 1,
                  updated_at: 1,

                  franchise_id: "$franchise._id",
                  franchise_name: "$franchise.name",
                  category_id: "$category._id",
                  category_name: "$category.name",
                  product_id: "$product._id",
                  product_name: "$product.name",
                  size: "$productFranchise.size",
                  price_base: "$productFranchise.price_base",
                },
              },
            ],
            total: [{ $count: "count" }],
          },
        },
      ]);

      return {
        data: result[0]?.data ?? [],
        total: result[0]?.total[0]?.count ?? 0,
      };
    } catch (error) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.DATABASE_QUERY_FAILED);
    }
  }

  public async getItem(id: string): Promise<IProductCategoryFranchise | null> {
    try {
      const result = await this.model.aggregate([
        // 🔹 Match by id
        { $match: { _id: new Types.ObjectId(id), is_deleted: false } },

        // JOIN CategoryFranchise
        {
          $lookup: {
            from: "categoryfranchises",
            localField: "category_franchise_id",
            foreignField: "_id",
            as: "categoryFranchise",
          },
        },
        { $unwind: "$categoryFranchise" },

        // JOIN Franchise
        {
          $lookup: {
            from: "franchises",
            localField: "categoryFranchise.franchise_id",
            foreignField: "_id",
            as: "franchise",
          },
        },
        { $unwind: "$franchise" },

        // JOIN ProductFranchise
        {
          $lookup: {
            from: "productfranchises",
            localField: "product_franchise_id",
            foreignField: "_id",
            as: "productFranchise",
          },
        },
        { $unwind: "$productFranchise" },

        // JOIN Product
        {
          $lookup: {
            from: "products",
            localField: "productFranchise.product_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },

        // JOIN Category
        {
          $lookup: {
            from: "categories",
            localField: "categoryFranchise.category_id",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: "$category" },

        // 🔹 Mapping
        {
          $project: {
            _id: 1,
            category_franchise_id: 1,
            product_franchise_id: 1,
            display_order: 1,
            is_active: 1,
            is_deleted: 1,
            created_at: 1,
            updated_at: 1,

            franchise_id: "$franchise._id",
            franchise_name: "$franchise.name",
            category_id: "$category._id",
            category_name: "$category.name",
            product_id: "$product._id",
            product_name: "$product.name",
            size: "$productFranchise.size",
            price_base: "$productFranchise.price_base",
          },
        },
      ]);

      return result[0] ?? null;
    } catch (error) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.DATABASE_QUERY_FAILED);
    }
  }

  // check if a category-franchise is already assigned to a product-franchise
  public async findByCategoryAndProduct(categoryId: string, productId: string) {
    return this.model.findOne({
      category_franchise_id: categoryId,
      product_franchise_id: productId,
      is_deleted: false,
    });
  }

  // get all product-category-franchises assigned to a category
  public findByCategory(categoryId: string, isActive?: boolean) {
    const filter: any = {
      category_franchise_id: categoryId,
      is_deleted: false,
    };

    if (isActive !== undefined) {
      filter.is_active = isActive;
    }

    return this.model.find(filter).sort({ display_order: 1, created_at: 1 });
  }

  // bulk update display order of product-category-franchises for a category
  public async bulkUpdateOrderByCategory(
    category_franchise_id: string,
    items: { id: string; display_order: number }[],
    session?: ClientSession,
  ) {
    const categoryObjectId = new Types.ObjectId(category_franchise_id);

    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: {
          _id: new Types.ObjectId(item.id),
          category_franchise_id: categoryObjectId,
          is_deleted: false,
        },
        update: {
          $set: {
            display_order: item.display_order,
          },
        },
      },
    }));

    const result = await this.model.bulkWrite(bulkOps as any, { session });

    // Safety check
    if (result.matchedCount !== items.length) {
      throw new Error("Reorder failed: some items were not matched");
    }

    return result;
  }

  public async getProductsWithCategories(franchiseId: string): Promise<any[]> {
    try {
      const pipeline: PipelineStage[] = [
        {
          $match: {
            is_deleted: false,
          },
        },

        // JOIN category-franchise
        {
          $lookup: {
            from: "categoryfranchises",
            localField: "category_franchise_id",
            foreignField: "_id",
            as: "categoryFranchise",
          },
        },
        { $unwind: "$categoryFranchise" },

        // FILTER franchise
        {
          $match: {
            "categoryFranchise.franchise_id": new Types.ObjectId(franchiseId),
          },
        },

        // JOIN category
        {
          $lookup: {
            from: "categories",
            localField: "categoryFranchise.category_id",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: "$category" },

        // GROUP categories theo product_franchise_id
        {
          $group: {
            _id: "$product_franchise_id",

            categories: {
              $addToSet: {
                category_id: "$category._id",
                category_name: "$category.name",
              },
            },
          },
        },

        {
          $project: {
            _id: 0,
            product_franchise_id: "$_id",
            categories: 1,
          },
        },
      ];

      return await this.model.aggregate(pipeline);
    } catch (error) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.DATABASE_QUERY_FAILED);
    }
  }
}
