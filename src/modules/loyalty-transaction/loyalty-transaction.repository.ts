import { BaseRepository } from "../../core";
import { ILoyaltyTransaction } from "./loyalty-transaction.interface";
import LoyaltyTransactionSchema from "./loyalty-transaction.model";

export class LoyaltyTransactionRepository extends BaseRepository<ILoyaltyTransaction> {
  constructor() {
    super(LoyaltyTransactionSchema);
  }

  /**
   * Get transaction history
   */
  public async getCustomerTransactions(customerFranchiseId: string, page = 1, limit = 20) {
    return this.model
      .find({
        customer_franchise_id: customerFranchiseId,
      })
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
  }

  /**
   * Create loyalty transaction
   */
  public async createTransaction(payload: Partial<ILoyaltyTransaction>) {
    return this.model.create(payload);
  }

  /**
   * Sum points
   */
  public async getCurrentPoints(customerFranchiseId: string): Promise<number> {
    const result = await this.model.aggregate([
      {
        $match: {
          customer_franchise_id: customerFranchiseId,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$point_change" },
        },
      },
    ]);

    return result?.[0]?.total ?? 0;
  }
}
