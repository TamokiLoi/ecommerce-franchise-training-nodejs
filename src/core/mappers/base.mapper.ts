import { Types } from "mongoose";

export interface MongoBaseEntity {
  _id: Types.ObjectId;
  is_active?: boolean;
  is_deleted?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export const mapBaseResponse = (entity: MongoBaseEntity) => {
  return {
    id: entity._id.toString(),
    is_active: entity.is_active ?? false,
    is_deleted: entity.is_deleted ?? false,
    created_at: entity.created_at?.toISOString() ?? "",
    updated_at: entity.updated_at?.toISOString() ?? "",
  };
};
