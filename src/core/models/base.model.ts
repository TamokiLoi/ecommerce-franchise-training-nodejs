import { BaseGroup } from "../enums";

export const BaseModelFields = {
  group_id: { type: String, required: true, enum: Object.values(BaseGroup), index: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  is_deleted: { type: Boolean, default: false },
};
