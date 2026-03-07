import { Types } from "mongoose";
import { BaseRepository, CartStatus, formatItemsQuery, HttpException, HttpStatus, MSG_BUSINESS } from "../../core";
import { ICart } from "./cart.interface";
import CartSchema from "./cart.model";
import { SearchItemDto, SearchPaginationItemDto } from "./dto/search.dto";

export class CartRepository extends BaseRepository<ICart> {
  constructor() {
    super(CartSchema);
  }

  public async getItems(model: SearchPaginationItemDto): Promise<{ data: ICart[]; total: number }> {
    const searchCondition = {
      ...new SearchItemDto(),
      ...model.searchCondition,
    };

    const { franchise_id, customer_id, staff_id, status, start_date, end_date, is_deleted } = searchCondition;

    const { pageNum, pageSize } = model.pageInfo;
    const skip = (pageNum - 1) * pageSize;

    let matchQuery: Record<string, any> = {};

    // common filters
    matchQuery = formatItemsQuery(matchQuery, { is_deleted });

    // ===== Basic filters =====
    if (franchise_id) {
      matchQuery.franchise_id = new Types.ObjectId(franchise_id);
    }

    if (customer_id) {
      matchQuery.customer_id = new Types.ObjectId(customer_id);
    }

    if (staff_id) {
      matchQuery.staff_id = new Types.ObjectId(staff_id);
    }

    if (status) {
      matchQuery.status = status;
    }

    if (start_date || end_date) {
      matchQuery.created_at = {};

      if (start_date) {
        matchQuery.created_at.$gte = new Date(start_date);
      }

      if (end_date) {
        const end = new Date(end_date);
        end.setHours(23, 59, 59, 999);
        matchQuery.created_at.$lte = end;
      }
    }

    try {
      const result = await this.model.aggregate([
        { $match: matchQuery },

        // ===== Franchise lookup =====
        {
          $lookup: {
            from: "franchises",
            localField: "franchise_id",
            foreignField: "_id",
            as: "franchise",
          },
        },
        { $unwind: { path: "$franchise", preserveNullAndEmptyArrays: true } },

        // ===== Customer lookup =====
        {
          $lookup: {
            from: "customers",
            localField: "customer_id",
            foreignField: "_id",
            as: "customer",
          },
        },
        { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },

        // ===== Staff lookup =====
        {
          $lookup: {
            from: "users",
            localField: "staff_id",
            foreignField: "_id",
            as: "staff",
          },
        },
        { $unwind: { path: "$staff", preserveNullAndEmptyArrays: true } },

        // ===== Voucher lookup =====
        {
          $lookup: {
            from: "vouchers",
            localField: "voucher_id",
            foreignField: "_id",
            as: "voucher",
          },
        },
        { $unwind: { path: "$voucher", preserveNullAndEmptyArrays: true } },

        // ===== Add computed fields =====
        {
          $addFields: {
            franchise_name: "$franchise.name",

            customer_name: "$customer.name",
            customer_email: "$customer.email",
            customer_phone: "$customer.phone",

            staff_name: "$staff.name",

            voucher_code: "$voucher.code",
          },
        },

        // ===== Remove raw lookup objects =====
        {
          $project: {
            franchise: 0,
            customer: 0,
            staff: 0,
            voucher: 0,
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

  /**
   * Get active cart by customer + franchise
   */
  public async getCartStatusActive(customerId: string, franchiseId: string): Promise<ICart | null> {
    return this.model
      .findOne({
        customer_id: new Types.ObjectId(customerId),
        franchise_id: new Types.ObjectId(franchiseId),
        status: CartStatus.ACTIVE,
        is_deleted: false,
      })
      .lean();
  }

  /**
   * Get full cart detail with items + options
   */
  public async getCartDetail(cartId: Types.ObjectId) {
    const result = await this.model.aggregate([
      {
        $match: { _id: cartId },
      },

      // CART ITEMS
      {
        $lookup: {
          from: "cartitems",
          localField: "_id",
          foreignField: "cart_id",
          as: "cart_items",
        },
      },

      // CUSTOMER
      {
        $lookup: {
          from: "customers",
          localField: "customer_id",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },

      // STAFF
      {
        $lookup: {
          from: "users",
          localField: "staff_id",
          foreignField: "_id",
          as: "staff",
        },
      },
      { $unwind: { path: "$staff", preserveNullAndEmptyArrays: true } },

      // FRANCHISE
      {
        $lookup: {
          from: "franchises",
          localField: "franchise_id",
          foreignField: "_id",
          as: "franchise",
        },
      },
      { $unwind: { path: "$franchise", preserveNullAndEmptyArrays: true } },

      // PRODUCT FRANCHISE OF CART ITEMS
      {
        $lookup: {
          from: "productfranchises",
          localField: "cart_items.product_franchise_id",
          foreignField: "_id",
          as: "product_franchises",
        },
      },

      // OPTION PRODUCT FRANCHISE
      {
        $lookup: {
          from: "productfranchises",
          localField: "cart_items.options.product_franchise_id",
          foreignField: "_id",
          as: "option_product_franchises",
        },
      },

      // PRODUCTS OF MAIN PRODUCT
      {
        $lookup: {
          from: "products",
          localField: "product_franchises.product_id",
          foreignField: "_id",
          as: "products",
        },
      },

      // PRODUCTS OF OPTIONS
      {
        $lookup: {
          from: "products",
          localField: "option_product_franchises.product_id",
          foreignField: "_id",
          as: "option_products",
        },
      },

      // BUILD CART ITEMS
      {
        $addFields: {
          cart_items: {
            $map: {
              input: "$cart_items",
              as: "item",
              in: {
                cart_item_id: "$$item._id",
                quantity: "$$item.quantity",
                product_cart_price: "$$item.product_cart_price",
                discount_amount: "$$item.discount_amount",
                line_total: "$$item.line_total",
                final_line_total: "$$item.final_line_total",
                options_hash: "$$item.options_hash",

                // PRODUCT FRANCHISE
                product_franchise_id: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$product_franchises",
                        as: "pf",
                        cond: { $eq: ["$$pf._id", "$$item.product_franchise_id"] },
                      },
                    },
                    0,
                  ],
                },

                // PRODUCT NAME
                product_name: {
                  $arrayElemAt: [
                    {
                      $map: {
                        input: {
                          $filter: {
                            input: "$products",
                            as: "p",
                            cond: {
                              $eq: [
                                "$$p._id",
                                {
                                  $arrayElemAt: [
                                    {
                                      $map: {
                                        input: {
                                          $filter: {
                                            input: "$product_franchises",
                                            as: "pf",
                                            cond: {
                                              $eq: ["$$pf._id", "$$item.product_franchise_id"],
                                            },
                                          },
                                        },
                                        as: "pf",
                                        in: "$$pf.product_id",
                                      },
                                    },
                                    0,
                                  ],
                                },
                              ],
                            },
                          },
                        },
                        as: "p",
                        in: "$$p.name",
                      },
                    },
                    0,
                  ],
                },

                // OPTIONS
                options: {
                  $map: {
                    input: "$$item.options",
                    as: "opt",
                    in: {
                      quantity: "$$opt.quantity",
                      product_franchise_id: "$$opt.product_franchise_id",
                      price_snapshot: "$$opt.price_snapshot",
                      discount_amount: "$$opt.discount_amount",
                      final_price: "$$opt.final_price",

                      product_name: {
                        $arrayElemAt: [
                          {
                            $map: {
                              input: {
                                $filter: {
                                  input: "$option_products",
                                  as: "p",
                                  cond: {
                                    $eq: [
                                      "$$p._id",
                                      {
                                        $arrayElemAt: [
                                          {
                                            $map: {
                                              input: {
                                                $filter: {
                                                  input: "$option_product_franchises",
                                                  as: "pf",
                                                  cond: {
                                                    $eq: ["$$pf._id", "$$opt.product_franchise_id"],
                                                  },
                                                },
                                              },
                                              as: "pf",
                                              in: "$$pf.product_id",
                                            },
                                          },
                                          0,
                                        ],
                                      },
                                    ],
                                  },
                                },
                              },
                              as: "p",
                              in: "$$p.name",
                            },
                          },
                          0,
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      {
        $project: {
          _id: 1,

          customer_id: 1,
          customer_name: "$customer.name",

          staff_id: 1,
          staff_name: "$staff.name",

          franchise_id: 1,
          franchise_name: "$franchise.name",

          status: 1,
          address: 1,
          phone: 1,
          loyalty_points_used: 1,
          promotion_discount: 1,
          voucher_discount: 1,
          loyalty_discount: 1,
          subtotal_amount: 1,
          final_amount: 1,

          cart_items: 1,
        },
      },
    ]);

    return result[0] || null;
  }

  /**
   * Apply voucher to cart
   */
  public async applyVoucher(cartId: Types.ObjectId, voucherId: Types.ObjectId, voucherCode: string): Promise<void> {
    await this.model.updateOne(
      { _id: cartId },
      {
        voucher_id: voucherId,
        voucher_code: voucherCode,
      },
    );
  }

  /**
   * Remove voucher
   */
  public async removeVoucher(cartId: Types.ObjectId): Promise<void> {
    await this.model.updateOne(
      { _id: cartId },
      {
        $unset: {
          voucher_id: "",
          voucher_code: "",
        },
      },
    );
  }

  /**
   * Update cart pricing
   */
  public async updateCartPricing(
    cartId: Types.ObjectId,
    payload: {
      subtotal_amount: number;
      promotion_discount?: number;
      voucher_discount?: number;
      loyalty_discount?: number;
      final_amount: number;
    },
  ): Promise<void> {
    await this.model.updateOne({ _id: cartId }, payload);
  }

  /**
   * Mark cart as checked out
   */
  public async markCheckedOut(cartId: Types.ObjectId): Promise<void> {
    await this.model.updateOne(
      { _id: cartId },
      {
        status: CartStatus.CHECKED_OUT,
      },
    );
  }
}
