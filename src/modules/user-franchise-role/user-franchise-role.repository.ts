import { PipelineStage, Types } from "mongoose";
import { MSG_BUSINESS } from "../../core/constants";
import { HttpStatus } from "../../core/enums";
import { HttpException } from "../../core/exceptions";
import { BaseRepository } from "../../core/repository";
import { formatItemsQuery } from "../../core/utils";
import { SearchItemDto, SearchPaginationItemDto } from "./dto/search.dto";
import { IUserFranchiseRole } from "./user-franchise-role.interface";
import UserFranchiseRoleSchema from "./user-franchise-role.model";

export class UserFranchiseRoleRepository extends BaseRepository<IUserFranchiseRole> {
  constructor() {
    super(UserFranchiseRoleSchema);
  }

  public async getItem(id: string): Promise<IUserFranchiseRole | null> {
    const query = [
      ...this.buildQueryPipeline({
        _id: new Types.ObjectId(id),
        is_deleted: false,
      }),
      { $limit: 1 },
    ];
    const result = await this.model.aggregate(query);
    return result[0] || null;
  }

  public async getItems(model: SearchPaginationItemDto): Promise<{ data: any[]; total: number }> {
    const searchCondition = {
      ...new SearchItemDto(),
      ...model.searchCondition,
    };

    const { user_id, franchise_id, role_id, is_deleted } = searchCondition;
    const { pageNum, pageSize } = model.pageInfo;

    let matchQuery: Record<string, any> = {};

    if (user_id && Types.ObjectId.isValid(user_id)) {
      matchQuery.shift_id = new Types.ObjectId(user_id);
    }

    if (franchise_id && Types.ObjectId.isValid(franchise_id)) {
      matchQuery.franchise_id = new Types.ObjectId(franchise_id);
    }

    if (role_id && Types.ObjectId.isValid(role_id)) {
      matchQuery.role_id = new Types.ObjectId(role_id);
    }

    // common + dynamic filters
    matchQuery = formatItemsQuery(matchQuery, { is_deleted });

    const skip = (pageNum - 1) * pageSize;

    try {
      const query: PipelineStage[] = [
        ...this.buildQueryPipeline(matchQuery),
        {
          $facet: {
            data: [{ $sort: { created_at: -1 } }, { $skip: skip }, { $limit: pageSize }],
            total: [{ $count: "count" }],
          },
        },
      ];

      const result = await this.model.aggregate(query);

      return {
        data: result[0].data,
        total: result[0].total[0]?.count || 0,
      };
    } catch (error) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.DATABASE_QUERY_FAILED);
    }
  }

  public async getAllRolesByUserId(userId: string): Promise<any[]> {
    try {
      const matchQuery = {
        user_id: new Types.ObjectId(userId),
        is_deleted: false,
      };

      const pipeline: PipelineStage[] = [
        ...this.buildQueryPipeline(matchQuery),

        // 🔥 JOIN ROLE
        {
          $lookup: {
            from: "roles",
            localField: "role_id",
            foreignField: "_id",
            as: "role",
          },
        },
        { $unwind: { path: "$role", preserveNullAndEmptyArrays: true } },

        // 🔥 JOIN FRANCHISE
        {
          $lookup: {
            from: "franchises",
            localField: "franchise_id",
            foreignField: "_id",
            as: "franchise",
          },
        },
        { $unwind: { path: "$franchise", preserveNullAndEmptyArrays: true } },

        // 🔥 JOIN USER
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

        // 🔥 PROJECT ĐÚNG FORMAT EM MUỐN
        {
          $project: {
            id: "$_id",
            is_active: 1,
            is_deleted: 1,
            created_at: 1,
            updated_at: 1,
            note: 1,

            franchise_id: "$franchise._id",
            franchise_code: "$franchise.code",
            franchise_name: "$franchise.name",

            role_id: "$role._id",
            role_code: "$role.code",
            role_name: "$role.name",

            user_id: "$user._id",
            user_name: "$user.name",
            user_email: "$user.email",
          },
        },

        { $sort: { created_at: -1 } },
      ];

      return await this.model.aggregate(pipeline);
    } catch (error) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.DATABASE_QUERY_FAILED);
    }
  }

  public async getUsersByFranchiseId(franchiseId: string): Promise<any[]> {
    try {
      const matchQuery = {
        franchise_id: new Types.ObjectId(franchiseId),
        is_deleted: false,
      };

      const pipeline: PipelineStage[] = [
        ...this.buildQueryPipeline(matchQuery),

        // JOIN USER
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },

        // JOIN ROLE
        {
          $lookup: {
            from: "roles",
            localField: "role_id",
            foreignField: "_id",
            as: "role",
          },
        },
        { $unwind: "$role" },

        // GROUP theo user
        {
          $group: {
            _id: "$user._id",

            user_name: { $first: "$user.name" },
            user_email: { $first: "$user.email" },
            user_phone: { $first: "$user.phone" },
            user_avatar: { $first: "$user.avatar_url" },

            user_roles: { $addToSet: "$role.name" },
          },
        },

        {
          $project: {
            _id: 0,
            user_id: "$_id",
            user_name: 1,
            user_email: 1,
            user_phone: 1,
            user_avatar: 1,
            user_roles: 1,
          },
        },

        { $sort: { user_name: 1 } },
      ];

      return await this.model.aggregate(pipeline);
    } catch (error) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.DATABASE_QUERY_FAILED);
    }
  }

  private buildQueryPipeline(matchQuery: Record<string, any>): PipelineStage[] {
    return [
      // 1️⃣ Filter
      { $match: matchQuery },

      // 2️⃣ Lookup related data
      {
        $lookup: {
          from: "franchises",
          localField: "franchise_id",
          foreignField: "_id",
          as: "franchise",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $lookup: {
          from: "roles",
          localField: "role_id",
          foreignField: "_id",
          as: "role",
        },
      },

      // 3️⃣ Unwind
      { $unwind: { path: "$franchise", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$role", preserveNullAndEmptyArrays: true } },

      // 4️⃣ Project
      {
        $project: {
          franchise_id: 1,
          franchise_code: "$franchise.code",
          franchise_name: "$franchise.name",

          user_id: 1,
          user_name: "$user.name",
          user_email: "$user.email",

          role_id: 1,
          role_code: "$role.code",
          role_name: "$role.name",

          note: 1,
          is_active: 1,
          is_deleted: 1,
          created_at: 1,
          updated_at: 1,
        },
      },
    ];
  }
}
