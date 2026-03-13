import { Types } from "mongoose";
import { BaseRepository, formatItemsQuery } from "../../core";
import { ILoyaltyRule } from "./loyalty-rule.interface";
import LoyaltyRuleSchema from "./loyalty-rule.model";
import { SearchPaginationItemDto } from "./dto/search.dto";

export class LoyaltyRuleRepository extends BaseRepository<ILoyaltyRule> {
  constructor() {
    super(LoyaltyRuleSchema);
  }

  public async getItems(model: SearchPaginationItemDto): Promise<{ data: ILoyaltyRule[]; total: number }> {
    const {
      franchise_id,
      earn_amount_per_point,
      redeem_value_per_point,
      tier,
      created_from,
      created_to,
      is_active,
      is_deleted,
    } = model.searchCondition;

    const { pageNum, pageSize } = model.pageInfo;

    let query: Record<string, any> = {};

    if (franchise_id) {
      query.franchise_id = new Types.ObjectId(franchise_id);
    }

    if (earn_amount_per_point !== undefined) {
      query.earn_amount_per_point = earn_amount_per_point;
    }

    if (redeem_value_per_point !== undefined) {
      query.redeem_value_per_point = redeem_value_per_point;
    }

    /**
     * filter tier inside tier_rules[]
     */
    if (tier) {
      query["tier_rules.tier"] = tier;
    }

    /**
     * created date range
     */
    if (created_from || created_to) {
      query.created_at = {};

      if (created_from) {
        query.created_at.$gte = new Date(created_from);
      }

      if (created_to) {
        query.created_at.$lte = new Date(created_to);
      }
    }

    query = formatItemsQuery(query, { is_active, is_deleted });

    const skip = (pageNum - 1) * pageSize;

    const result = await this.model.aggregate([
      {
        $match: query,
      },

      /**
       * join franchise
       */
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

      /**
       * add franchise name
       */
      {
        $addFields: {
          franchise_name: "$franchise.name",
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
      data: result[0]?.data ?? [],
      total: result[0]?.total?.[0]?.count || 0,
    };
  }

  /**
   * Get loyalty rule by franchise
   */
  public async getByFranchiseId(franchiseId: string): Promise<ILoyaltyRule | null> {
    return this.model
      .findOne({
        franchise_id: franchiseId,
        is_deleted: false,
      })
      .lean();
  }

  /**
   * Create or update loyalty rule (admin config)
   */
  public async upsertRule(franchiseId: string, payload: Partial<ILoyaltyRule>): Promise<ILoyaltyRule> {
    return this.model.findOneAndUpdate(
      {
        franchise_id: franchiseId,
      },
      {
        $set: payload,
      },
      {
        new: true,
        upsert: true,
      },
    );
  }

  /**
   * Get tier rules sorted by min_points
   */
  public async getTierRules(franchiseId: string) {
    const rule = await this.model
      .findOne(
        {
          franchise_id: franchiseId,
          is_deleted: false,
        },
        {
          tier_rules: 1,
        },
      )
      .lean();

    if (!rule) return [];

    return rule.tier_rules.sort((a, b) => a.min_points - b.min_points);
  }

  /**
   * Resolve tier from points
   */
  public async getTierByPoints(franchiseId: string, points: number) {
    const rule = await this.getByFranchiseId(franchiseId);

    if (!rule) return null;

    const tier = rule.tier_rules.find((tier) => {
      const min = tier.min_points;
      const max = tier.max_points ?? Infinity;

      return points >= min && points <= max;
    });

    return tier ?? null;
  }
}
