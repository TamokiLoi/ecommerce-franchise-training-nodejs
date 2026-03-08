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

  public async getItems(
    model: SearchPaginationItemDto,
  ): Promise<{ data: IVoucher[]; total: number }> {
    const searchCondition = {
      ...new SearchItemDto(),
      ...model.searchCondition,
    } as any;

    const {
      code,
      franchise_id,
      product_franchise_id,
      type,
      start_date,
      end_date,
      is_active,
      is_deleted,
    } = searchCondition;

    const { pageNum, pageSize } = model.pageInfo;

    let conditions: Record<string, any> = {};

    if (code) conditions.code = code;
    if (franchise_id && Types.ObjectId.isValid(franchise_id))
      conditions.franchise_id = new Types.ObjectId(franchise_id);
    if (product_franchise_id && Types.ObjectId.isValid(product_franchise_id))
      conditions.product_franchise_id = new Types.ObjectId(
        product_franchise_id,
      );
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
      const [data, total] = await Promise.all([
        this.model
          .find(conditions)
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(pageSize)
          .exec(),
        this.model.countDocuments(conditions).exec(),
      ]);

      return { data, total };
    } catch (error) {
      throw new HttpException(
        HttpStatus.BadRequest,
        MSG_BUSINESS.DATABASE_QUERY_FAILED,
      );
    }
  }
}
