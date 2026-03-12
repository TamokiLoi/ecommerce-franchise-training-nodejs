import { ClientSession, QueryOptions, UpdateQuery } from "mongoose";
import { BaseRepository } from "../../core/repository";
import { IUser } from "./user.interface";
import UserSchema from "./user.model";
import { SearchItemDto, SearchPaginationItemDto } from "./dto/search.dto";
import { formatItemsQuery, HttpException, HttpStatus, MSG_BUSINESS } from "../../core";

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(UserSchema);
  }

  public async getItems(model: SearchPaginationItemDto): Promise<{ data: IUser[]; total: number }> {
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

  public async createUser(data: Partial<IUser>, session?: ClientSession): Promise<IUser> {
    const result = await this.model.create([data], session ? { session } : {});
    return result[0];
  }

  public async findByIdAndUpdate(
    id: string,
    update: UpdateQuery<IUser>,
    options: QueryOptions = { new: true },
  ): Promise<IUser | null> {
    return this.model.findByIdAndUpdate(id, { ...update, updated_at: new Date() }, options);
  }

  public async exists(condition: Record<string, any>): Promise<boolean> {
    const result = await this.model.findOne({
      ...condition,
      is_deleted: false,
    });
    return !!result;
  }

  public async findByEmail(email: string): Promise<IUser | null> {
    return this.model.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
      is_deleted: false,
    });
  }

  public async findToken(token: string): Promise<IUser | null> {
    return this.model.findOne({
      verification_token: token,
      is_deleted: false,
    });
  }

  public async findUserById(userId: string): Promise<IUser | null> {
    return this.model.findOne({ _id: userId, is_deleted: false }).select("-password").lean().exec();
  }

  public async findUserByIdWithPassword(userId: string): Promise<IUser | null> {
    return this.model.findOne({ _id: userId, is_deleted: false }).exec();
  }

  public async searchByKeyword(keyword: string): Promise<IUser[]> {
    if (!keyword) return [];
    const normalizedKeyword = keyword.trim();
    const regex = new RegExp(normalizedKeyword, "i");

    return this.model.find({
      is_deleted: false,
      $or: [{ name: regex }, { email: regex }],
    });
  }
}
