import { ClientSession, Types } from "mongoose";
import { BaseRepository, OrderStatus } from "../../core";
import { IOrder } from "./order.interface";
import OrderSchema from "./order.model";

export class OrderRepository extends BaseRepository<IOrder> {
  constructor() {
    super(OrderSchema);
  }

  public async getOrdersForStaff(franchiseId: string, status?: OrderStatus) {
    const matchQuery: Record<string, any> = {
      franchise_id: new Types.ObjectId(franchiseId),
      is_deleted: false,
    };

    if (status) {
      matchQuery.status = status;
    }

    return this.model.aggregate([
      {
        $match: matchQuery,
      },

      {
        $sort: { created_at: 1 },
      },

      {
        $project: {
          _id: 1,
          code: 1,
          customer_name: 1,
          phone: 1,

          status: 1,

          subtotal_amount: 1,
          final_amount: 1,

          created_at: 1,
        },
      },
    ]);
  }

  public async getOrderDetail(orderId: Types.ObjectId) {
    const result = await this.model.aggregate([
      // 1. base info (customer, staff, franchise...)
      ...this.buildOrderBaseAggregate({ _id: orderId }),

      // 2. 🔥 thay vì viết lại 5 cái lookup
      ...this.buildOrderItemLookups(),

      // 3. 🔥 thay vì viết lại $addFields dài
      ...this.buildOrderItemsProjection({
        includeProductInfo: true,
      }),

      // 4. giữ nguyên project
      {
        $project: {
          _id: 1,
          code: 1,
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
          order_items: 1,
        },
      },
    ]);

    return result[0] || null;
  }

  public async getOrderDetailByCode(orderCode: string) {
    const result = await this.model.aggregate([
      ...this.buildOrderBaseAggregate({ code: orderCode }),

      ...this.buildOrderItemLookups(),

      ...this.buildOrderItemsProjection({
        includeProductInfo: true,
      }),

      {
        $project: {
          _id: 1,
          code: 1,

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

          order_items: 1,
        },
      },
    ]);

    return result[0] || null;
  }

  public async findByCartId(cartId: Types.ObjectId) {
    const result = await this.model.aggregate([
      ...this.buildOrderBaseAggregate({
        cart_id: cartId,
        is_deleted: false,
      }),

      ...this.buildOrderItemLookups(),

      ...this.buildOrderItemsProjection({
        includeProductInfo: true,
      }),

      {
        $project: {
          _id: 1,
          cart_id: 1,
          code: 1,

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

          order_items: 1,
        },
      },
    ]);

    return result[0] || null;
  }

  public async getOrdersByCustomerId(customerId: string, status?: OrderStatus) {
    const matchQuery: Record<string, any> = {
      customer_id: new Types.ObjectId(customerId),
      is_deleted: false,
    };

    if (status) {
      matchQuery.status = status;
    }

    const result = await this.model.aggregate([
      ...this.buildOrderBaseAggregate(matchQuery),

      { $sort: { updated_at: -1, created_at: -1 } },

      ...this.buildOrderItemLookups(),

      ...this.buildOrderItemsProjection({
        includeProductInfo: true,
      }),

      {
        $project: {
          _id: 1,
          code: 1,

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

          order_items: 1,
        },
      },
    ]);

    return result;
  }

  private buildOrderBaseAggregate(matchQuery: Record<string, any>) {
    return [
      { $match: matchQuery },

      /**
       * Franchise
       */
      {
        $lookup: {
          from: "franchises",
          localField: "franchise_id",
          foreignField: "_id",
          as: "franchise",
        },
      },
      { $unwind: { path: "$franchise", preserveNullAndEmptyArrays: true } },

      /**
       * Customer
       */
      {
        $lookup: {
          from: "customers",
          localField: "customer_id",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },

      /**
       * Staff
       */
      {
        $lookup: {
          from: "users",
          localField: "staff_id",
          foreignField: "_id",
          as: "staff",
        },
      },
      { $unwind: { path: "$staff", preserveNullAndEmptyArrays: true } },

      /**
       * Voucher
       */
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

  private buildOrderItemLookups() {
    return [
      {
        $lookup: {
          from: "orderitems",
          localField: "_id",
          foreignField: "order_id",
          as: "order_items",
        },
      },
      {
        $lookup: {
          from: "productfranchises",
          localField: "order_items.product_franchise_id",
          foreignField: "_id",
          as: "product_franchises",
        },
      },
      {
        $lookup: {
          from: "productfranchises",
          localField: "order_items.options.product_franchise_id",
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

      // 🔥 merge product vào pf (KEY cải tiến)
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

  private buildOrderItemsProjection(options?: { includeProductInfo?: boolean }) {
    const includeProduct = options?.includeProductInfo ?? false;

    return [
      {
        $addFields: {
          order_items: {
            $map: {
              input: "$order_items",
              as: "item",
              in: {
                order_item_id: "$$item._id",
                quantity: "$$item.quantity",
                price_snapshot: "$$item.price_snapshot",
                discount_amount: "$$item.discount_amount",
                line_total: "$$item.line_total",
                final_line_total: "$$item.final_line_total",
                options_hash: "$$item.options_hash",
                note: "$$item.note",

                ...(includeProduct && {
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
                }),

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

                      ...(includeProduct && {
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

  public async updateStatusOrder(
    orderId: string,
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
    session?: ClientSession,
  ): Promise<IOrder | null> {
    return this.model.findOneAndUpdate(
      {
        _id: new Types.ObjectId(orderId),
        status: fromStatus,
      },
      {
        $set: {
          status: toStatus,
          updated_at: new Date(),
        },
      },
      {
        new: true,
        session,
      },
    );
  }

  public async confirmOrder(orderId: Types.ObjectId, session?: ClientSession) {
    return this.model.findByIdAndUpdate(
      orderId,
      {
        status: OrderStatus.CONFIRMED,
        confirmed_at: new Date(),
        updated_at: new Date(),
      },
      { new: true, session },
    );
  }

  public async completeOrder(orderId: Types.ObjectId, session?: ClientSession) {
    return this.model.findByIdAndUpdate(
      orderId,
      {
        status: OrderStatus.COMPLETED,
        completed_at: new Date(),
        updated_at: new Date(),
      },
      { new: true, session },
    );
  }

  public async cancelOrder(orderId: Types.ObjectId, failed_reason: string, session?: ClientSession) {
    return this.model.findByIdAndUpdate(
      orderId,
      {
        status: OrderStatus.CANCELED,
        failed_reason,
        cancelled_at: new Date(),
        updated_at: new Date(),
      },
      { new: true, session },
    );
  }
}
