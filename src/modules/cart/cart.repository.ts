import { ClientSession, Types } from "mongoose";
import { BaseRepository, CartStatus, formatItemsQuery, HttpException, HttpStatus, MSG_BUSINESS } from "../../core";
import { ICart } from "./cart.interface";
import CartSchema from "./cart.model";
import { SearchItemDto, SearchPaginationItemDto } from "./dto/search.dto";

export class CartRepository extends BaseRepository<ICart> {
  constructor() {
    super(CartSchema);
  }

  public async findActiveCartById(cartId: string, session?: ClientSession): Promise<ICart | null> {
    const query = this.model
      .findOne({
        _id: new Types.ObjectId(cartId),
        status: CartStatus.ACTIVE,
        is_deleted: false,
      })
      .populate("cart_items");

    if (session) query.session(session);

    return query;
  }

  public async updateStatus(cartId: string, status: CartStatus, session?: ClientSession) {
    return this.model.updateOne({ _id: cartId }, { $set: { status } }, { session });
  }

  public async findByIdForUpdate(id: string, is_deleted = false) {
    return this.model.findOne({
      _id: new Types.ObjectId(id),
      is_deleted,
    });
  }

  public async getItems(model: SearchPaginationItemDto): Promise<{ data: ICart[]; total: number }> {
    const searchCondition = {
      ...new SearchItemDto(),
      ...model.searchCondition,
    };

    const { franchise_id, customer_id, staff_id, status, start_date, end_date, is_deleted } = searchCondition;

    const { pageNum = 1, pageSize = 10 } = model.pageInfo;
    const skip = (pageNum - 1) * pageSize;

    let matchQuery: Record<string, any> = {};

    matchQuery = formatItemsQuery(matchQuery, { is_deleted });

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
      const pipeline = this.buildCartBaseAggregate(matchQuery);

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
        data: result[0]?.data ?? [],
        total: result[0]?.total?.[0]?.count ?? 0,
      };
    } catch (error) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.DATABASE_QUERY_FAILED);
    }
  }

  public async countCartsByCustomer(customerId: string, status?: CartStatus): Promise<number> {
    const query: Record<string, any> = {
      customer_id: new Types.ObjectId(customerId),
      is_deleted: false,
    };

    if (status) {
      query.status = status;
    }

    return this.model.countDocuments(query);
  }

  public async getCartsByCustomer2(customerId: string, status?: CartStatus) {
    const matchQuery: Record<string, any> = {
      customer_id: new Types.ObjectId(customerId),
      is_deleted: false,
    };

    if (status) {
      matchQuery.status = status;
    } else {
      matchQuery.status = { $ne: CartStatus.ACTIVE };
    }

    const result = await this.model.aggregate([
      ...this.buildCartBaseAggregate(matchQuery),

      { $sort: { updated_at: -1 } },

      {
        $lookup: {
          from: "cartitems",
          localField: "_id",
          foreignField: "cart_id",
          as: "cart_items",
        },
      },

      {
        $lookup: {
          from: "productfranchises",
          localField: "cart_items.product_franchise_id",
          foreignField: "_id",
          as: "product_franchises",
        },
      },

      {
        $lookup: {
          from: "productfranchises",
          localField: "cart_items.options.product_franchise_id",
          foreignField: "_id",
          as: "option_product_franchises",
        },
      },

      {
        $lookup: {
          from: "products",
          localField: "product_franchises.product_id",
          foreignField: "_id",
          as: "products",
        },
      },

      {
        $lookup: {
          from: "products",
          localField: "option_product_franchises.product_id",
          foreignField: "_id",
          as: "option_products",
        },
      },

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
                note: "$$item.note",

                // ✅ product name
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

                // 🔥 product image
                product_image_url: {
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
                        in: "$$p.image_url",
                      },
                    },
                    0,
                  ],
                },

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

                      // 🔥 option image
                      product_image_url: {
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
                              in: "$$p.image_url",
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
          customer_name: 1,
          staff_id: 1,
          staff_name: 1,
          staff_email: 1,
          franchise_id: 1,
          franchise_name: 1,
          status: 1,
          address: 1,
          phone: 1,
          message: 1,
          loyalty_points_used: 1,
          promotion_discount: 1,
          voucher_discount: 1,
          loyalty_discount: 1,
          subtotal_amount: 1,
          final_amount: 1,
          promotion_id: 1,
          promotion_type: 1,
          promotion_value: 1,
          voucher_id: 1,
          voucher_code: 1,
          voucher_type: 1,
          voucher_value: 1,
          cart_items: 1,
        },
      },
    ]);

    return result;
  }

  public async getCartDetail2(cartId: Types.ObjectId) {
    const result = await this.model.aggregate([
      ...this.buildCartBaseAggregate({ _id: cartId }),

      // 1. Cart Items
      {
        $lookup: {
          from: "cartitems",
          localField: "_id",
          foreignField: "cart_id",
          as: "cart_items",
        },
      },

      // 2. Product franchises (main)
      {
        $lookup: {
          from: "productfranchises",
          localField: "cart_items.product_franchise_id",
          foreignField: "_id",
          as: "product_franchises",
        },
      },

      // 3. Option product franchises
      {
        $lookup: {
          from: "productfranchises",
          localField: "cart_items.options.product_franchise_id",
          foreignField: "_id",
          as: "option_product_franchises",
        },
      },

      // 4. Products (main)
      {
        $lookup: {
          from: "products",
          localField: "product_franchises.product_id",
          foreignField: "_id",
          as: "products",
        },
      },

      // 5. Products (option)
      {
        $lookup: {
          from: "products",
          localField: "option_product_franchises.product_id",
          foreignField: "_id",
          as: "option_products",
        },
      },

      // 🔥 6. Merge product vào product_franchises
      {
        $addFields: {
          product_franchises: {
            $map: {
              input: "$product_franchises",
              as: "pf",
              in: {
                $mergeObjects: [
                  "$$pf",
                  {
                    product: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$products",
                            as: "p",
                            cond: { $eq: ["$$p._id", "$$pf.product_id"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },

          option_product_franchises: {
            $map: {
              input: "$option_product_franchises",
              as: "pf",
              in: {
                $mergeObjects: [
                  "$$pf",
                  {
                    product: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$option_products",
                            as: "p",
                            cond: { $eq: ["$$p._id", "$$pf.product_id"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },

      // 🔥 7. Build cart_items (clean hơn rất nhiều)
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
                note: "$$item.note",

                // 🔥 PRODUCT INFO (clean)
                product: {
                  $let: {
                    vars: {
                      pf: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$product_franchises",
                              as: "pf",
                              cond: {
                                $eq: ["$$pf._id", "$$item.product_franchise_id"],
                              },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: {
                      name: "$$pf.product.name",
                      image_url: "$$pf.product.image_url",
                    },
                  },
                },

                // 🔥 OPTIONS
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

                      product: {
                        $let: {
                          vars: {
                            pf: {
                              $arrayElemAt: [
                                {
                                  $filter: {
                                    input: "$option_product_franchises",
                                    as: "pf",
                                    cond: {
                                      $eq: ["$$pf._id", "$$opt.product_franchise_id"],
                                    },
                                  },
                                },
                                0,
                              ],
                            },
                          },
                          in: {
                            name: "$$pf.product.name",
                            image_url: "$$pf.product.image_url",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // 8. Final projection
      {
        $project: {
          _id: 1,

          customer_id: 1,
          customer_name: 1,

          staff_id: 1,
          staff_name: 1,
          staff_email: 1,

          franchise_id: 1,
          franchise_name: 1,

          status: 1,
          address: 1,
          phone: 1,
          message: 1,
          loyalty_points_used: 1,
          promotion_discount: 1,
          voucher_discount: 1,
          loyalty_discount: 1,
          subtotal_amount: 1,
          final_amount: 1,

          promotion_id: 1,
          promotion_type: 1,
          promotion_value: 1,

          voucher_id: 1,
          voucher_code: 1,
          voucher_type: 1,
          voucher_value: 1,

          cart_items: 1,
        },
      },
    ]);

    return result[0] || null;
  }

  public async getCartsByCustomer(customerId: string, status?: CartStatus) {
    const matchQuery: Record<string, any> = {
      customer_id: new Types.ObjectId(customerId),
      is_deleted: false,
    };

    matchQuery.status = status ? status : { $ne: CartStatus.ACTIVE };

    const result = await this.model.aggregate([
      ...this.buildCartBaseAggregate(matchQuery),

      { $sort: { updated_at: -1 } },

      ...this.buildCartItemLookups(),

      ...this.buildCartItemsProjection("flat"),

      {
        $project: {
          _id: 1,
          customer_id: 1,
          customer_name: 1,
          staff_id: 1,
          staff_name: 1,
          staff_email: 1,
          franchise_id: 1,
          franchise_name: 1,
          status: 1,
          address: 1,
          phone: 1,
          message: 1,
          loyalty_points_used: 1,
          promotion_discount: 1,
          voucher_discount: 1,
          loyalty_discount: 1,
          subtotal_amount: 1,
          final_amount: 1,
          promotion_id: 1,
          promotion_type: 1,
          promotion_value: 1,
          voucher_id: 1,
          voucher_code: 1,
          voucher_type: 1,
          voucher_value: 1,
          cart_items: 1,
        },
      },
    ]);

    return result;
  }

  public async getCartDetail(cartId: Types.ObjectId) {
    const result = await this.model.aggregate([
      ...this.buildCartBaseAggregate({ _id: cartId }),

      ...this.buildCartItemLookups(),

      ...this.buildCartItemsProjection("nested"),

      {
        $project: {
          _id: 1,
          customer_id: 1,
          customer_name: 1,
          staff_id: 1,
          staff_name: 1,
          staff_email: 1,
          franchise_id: 1,
          franchise_name: 1,
          status: 1,
          address: 1,
          phone: 1,
          message: 1,
          loyalty_points_used: 1,
          promotion_discount: 1,
          voucher_discount: 1,
          loyalty_discount: 1,
          subtotal_amount: 1,
          final_amount: 1,
          promotion_id: 1,
          promotion_type: 1,
          promotion_value: 1,
          voucher_id: 1,
          voucher_code: 1,
          voucher_type: 1,
          voucher_value: 1,
          cart_items: 1,
        },
      },
    ]);

    return result[0] || null;
  }

  private buildCartBaseAggregate(matchQuery: Record<string, any>) {
    return [
      { $match: matchQuery },

      // Franchise
      {
        $lookup: {
          from: "franchises",
          localField: "franchise_id",
          foreignField: "_id",
          as: "franchise",
        },
      },
      { $unwind: { path: "$franchise", preserveNullAndEmptyArrays: true } },

      // Customer
      {
        $lookup: {
          from: "customers",
          localField: "customer_id",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },

      // Staff
      {
        $lookup: {
          from: "users",
          localField: "staff_id",
          foreignField: "_id",
          as: "staff",
        },
      },
      { $unwind: { path: "$staff", preserveNullAndEmptyArrays: true } },

      // Voucher
      {
        $lookup: {
          from: "vouchers",
          localField: "voucher_id",
          foreignField: "_id",
          as: "voucher",
        },
      },
      { $unwind: { path: "$voucher", preserveNullAndEmptyArrays: true } },

      {
        $addFields: {
          franchise_name: "$franchise.name",
          customer_name: "$customer.name",
          customer_email: "$customer.email",
          customer_phone: "$customer.phone",
          staff_name: "$staff.name",
          staff_email: "$staff.email",
          voucher_code: "$voucher.code",

          phone: "$phone",
          address: "$address",
          message: "$message",
        },
      },

      {
        $project: {
          franchise: 0,
          customer: 0,
          staff: 0,
          voucher: 0,
        },
      },
    ];
  }

  private buildCartItemLookups() {
    return [
      {
        $lookup: {
          from: "cartitems",
          localField: "_id",
          foreignField: "cart_id",
          as: "cart_items",
        },
      },
      {
        $lookup: {
          from: "productfranchises",
          localField: "cart_items.product_franchise_id",
          foreignField: "_id",
          as: "product_franchises",
        },
      },
      {
        $lookup: {
          from: "productfranchises",
          localField: "cart_items.options.product_franchise_id",
          foreignField: "_id",
          as: "option_product_franchises",
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "product_franchises.product_id",
          foreignField: "_id",
          as: "products",
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "option_product_franchises.product_id",
          foreignField: "_id",
          as: "option_products",
        },
      },

      // 🔥 merge product vào pf (core improvement)
      {
        $addFields: {
          product_franchises: {
            $map: {
              input: "$product_franchises",
              as: "pf",
              in: {
                $mergeObjects: [
                  "$$pf",
                  {
                    product: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$products",
                            as: "p",
                            cond: { $eq: ["$$p._id", "$$pf.product_id"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },
          option_product_franchises: {
            $map: {
              input: "$option_product_franchises",
              as: "pf",
              in: {
                $mergeObjects: [
                  "$$pf",
                  {
                    product: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$option_products",
                            as: "p",
                            cond: { $eq: ["$$p._id", "$$pf.product_id"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
    ];
  }

  private buildCartItemsProjection(type: "flat" | "nested") {
    const isFlat = type === "flat";

    return [
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
                note: "$$item.note",

                // 🔥 PRODUCT
                ...(isFlat
                  ? {
                      product_name: {
                        $let: {
                          vars: {
                            pf: {
                              $arrayElemAt: [
                                {
                                  $filter: {
                                    input: "$product_franchises",
                                    as: "pf",
                                    cond: {
                                      $eq: ["$$pf._id", "$$item.product_franchise_id"],
                                    },
                                  },
                                },
                                0,
                              ],
                            },
                          },
                          in: "$$pf.product.name",
                        },
                      },
                      product_image_url: {
                        $let: {
                          vars: {
                            pf: {
                              $arrayElemAt: [
                                {
                                  $filter: {
                                    input: "$product_franchises",
                                    as: "pf",
                                    cond: {
                                      $eq: ["$$pf._id", "$$item.product_franchise_id"],
                                    },
                                  },
                                },
                                0,
                              ],
                            },
                          },
                          in: "$$pf.product.image_url",
                        },
                      },
                    }
                  : {
                      product: {
                        $let: {
                          vars: {
                            pf: {
                              $arrayElemAt: [
                                {
                                  $filter: {
                                    input: "$product_franchises",
                                    as: "pf",
                                    cond: {
                                      $eq: ["$$pf._id", "$$item.product_franchise_id"],
                                    },
                                  },
                                },
                                0,
                              ],
                            },
                          },
                          in: {
                            name: "$$pf.product.name",
                            image_url: "$$pf.product.image_url",
                          },
                        },
                      },
                    }),

                // 🔥 OPTIONS
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

                      ...(isFlat
                        ? {
                            product_name: {
                              $let: {
                                vars: {
                                  pf: {
                                    $arrayElemAt: [
                                      {
                                        $filter: {
                                          input: "$option_product_franchises",
                                          as: "pf",
                                          cond: {
                                            $eq: ["$$pf._id", "$$opt.product_franchise_id"],
                                          },
                                        },
                                      },
                                      0,
                                    ],
                                  },
                                },
                                in: "$$pf.product.name",
                              },
                            },
                            product_image_url: {
                              $let: {
                                vars: {
                                  pf: {
                                    $arrayElemAt: [
                                      {
                                        $filter: {
                                          input: "$option_product_franchises",
                                          as: "pf",
                                          cond: {
                                            $eq: ["$$pf._id", "$$opt.product_franchise_id"],
                                          },
                                        },
                                      },
                                      0,
                                    ],
                                  },
                                },
                                in: "$$pf.product.image_url",
                              },
                            },
                          }
                        : {
                            product: {
                              $let: {
                                vars: {
                                  pf: {
                                    $arrayElemAt: [
                                      {
                                        $filter: {
                                          input: "$option_product_franchises",
                                          as: "pf",
                                          cond: {
                                            $eq: ["$$pf._id", "$$opt.product_franchise_id"],
                                          },
                                        },
                                      },
                                      0,
                                    ],
                                  },
                                },
                                in: {
                                  name: "$$pf.product.name",
                                  image_url: "$$pf.product.image_url",
                                },
                              },
                            },
                          }),
                    },
                  },
                },
              },
            },
          },
        },
      },
    ];
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
      })
      .lean()
      .exec();
  }

  /**
   * Apply voucher to cart
   */
  public async applyVoucher(cartId: Types.ObjectId, voucher_id: Types.ObjectId, voucher_code: string): Promise<void> {
    await this.model.updateOne(
      { _id: cartId },
      {
        voucher_id,
        voucher_code,
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
          voucher_type: "",
          voucher_value: 0,
          voucher_discount: 0,
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
