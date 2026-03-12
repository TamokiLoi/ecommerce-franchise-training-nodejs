import { ClientSession } from "mongoose";
import { BaseRepository, formatItemsQuery, HttpException, HttpStatus, MSG_BUSINESS } from "../../core";
import { ICustomer } from "./customer.interface";
import CustomerSchema from "./customer.model";
import { SearchItemDto, SearchPaginationItemDto } from "./dto/search.dto";

export class CustomerRepository extends BaseRepository<ICustomer> {
  constructor() {
    super(CustomerSchema);
  }

  public async getItems(model: SearchPaginationItemDto): Promise<{ data: ICustomer[]; total: number }> {
    const searchCondition = {
      ...new SearchItemDto(),
      ...model.searchCondition,
    };

    const { keyword, is_active, is_deleted } = searchCondition;
    const { pageNum, pageSize } = model.pageInfo;

    let matchQuery: Record<string, any> = {};

    // keyword search
    if (keyword?.trim()) {
      matchQuery.$or = [
        { email: { $regex: `^${keyword.trim()}`, $options: "i" } },
        { name: { $regex: keyword.trim(), $options: "i" } },
      ];
    }

    // common filters
    matchQuery = formatItemsQuery(matchQuery, { is_active, is_deleted });

    const skip = (pageNum - 1) * pageSize;

    try {
      const result = await this.model.aggregate([
        { $match: matchQuery },
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

  public async findByIdNoPassword(_id: string): Promise<ICustomer | null> {
    return this.model.findOne({ _id, is_deleted: false }).select("-password").lean().exec();
  }

  public async findByEmail(email: string): Promise<ICustomer | null> {
    return this.model.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
      is_deleted: false,
    });
  }

  public async findByToken(token: string): Promise<ICustomer | null> {
    return this.model.findOne({
      verification_token: token,
      is_deleted: false,
    });
  }

  public async updateCustomerTokenVersion(id: string, session?: ClientSession): Promise<ICustomer | null> {
    return this.model.findByIdAndUpdate(
      id,
      { is_verified: true, verification_token: null, verification_token_expires: null, updated_at: new Date() },
      { new: true, session },
    );
  }

  public async updateCustomerResendToken(
    id: string,
    token: string,
    tokenExpires: Date,
    session?: ClientSession,
  ): Promise<ICustomer | null> {
    return this.model.findByIdAndUpdate(
      id,
      { verification_token: token, verification_token_expires: tokenExpires, updated_at: new Date() },
      { new: true, session },
    );
  }

  public async updateCustomerPassword(
    id: string,
    newPassword: string,
    isForgotPassword: boolean = false,
    session?: ClientSession,
  ): Promise<ICustomer | null> {
    return this.model.findByIdAndUpdate(
      id,
      {
        password: newPassword,
        last_reset_password_at: isForgotPassword ? new Date() : undefined,
        updated_at: new Date(),
      },
      { new: true, session },
    );
  }

  public async increaseTokenVersion(id: string, session?: ClientSession): Promise<ICustomer | null> {
    return this.model.findByIdAndUpdate(
      id,
      { $inc: { token_version: 1 }, updated_at: new Date() },
      { new: true, session },
    );
  }

  public async searchByKeyword(keyword: string): Promise<ICustomer[]> {
    if (!keyword) return [];

    const normalizedKeyword = keyword.trim();
    const regex = new RegExp(normalizedKeyword, "i");

    return this.model.find({
      is_deleted: false,
      $or: [{ name: regex }, { email: regex }, { phone: regex }],
    });
  }
}
