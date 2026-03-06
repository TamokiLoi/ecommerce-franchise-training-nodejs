import { BaseRepository } from "../../core/repository";
import { formatItemsQuery } from "../../core/utils";
import { SearchPaginationItemDto } from "./dto/search.dto";
import { IPromotion } from "./promotion.interface";
import PromotionSchema from "./promotion.model";

export class PromotionRepository extends BaseRepository<IPromotion> {
  constructor() {
    super(PromotionSchema);
  }

  public async getItems(
    model: SearchPaginationItemDto,
  ): Promise<{ data: IPromotion[]; total: number }> {
    const {
      franchise_id,
      product_franchise_id,
      type,
      value,
      start_date,
      end_date,
      is_active,
      is_deleted,
    } = model.searchCondition;

    const { pageNum, pageSize } = model.pageInfo;

    let query: Record<string, any> = {};

    if (franchise_id) query.franchise_id = franchise_id;
    if (product_franchise_id) query.product_franchise_id = product_franchise_id;
    if (type) query.type = type;
    if (value !== undefined) query.value = value;

    // promotion time overlap
    if (start_date || end_date) {
      query.$and = [];

      if (start_date) {
        query.$and.push({ end_date: { $gte: new Date(start_date) } });
      }

      if (end_date) {
        query.$and.push({ start_date: { $lte: new Date(end_date) } });
      }
    }

    query = formatItemsQuery(query, { is_active, is_deleted });

    const skip = (pageNum - 1) * pageSize;

    const [data, total] = await Promise.all([
      this.model
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.model.countDocuments(query),
    ]);

    return { data, total };
  }
}
