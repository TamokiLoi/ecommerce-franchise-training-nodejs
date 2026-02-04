import mongoose, { HydratedDocument, Schema } from "mongoose";
import { COLLECTION_NAME } from "../../core/constants";
import { BaseRole } from "../../core/enums";
import { BaseModelFields } from "../../core/models";
import { UserRoles } from "./user.constant";
import { UserFieldName } from "./user.enum";
import { IUser } from "./user.interface";

const UserSchemaEntity = new Schema({
  [UserFieldName.EMAIL]: { type: String, unique: true, index: true },
  [UserFieldName.PASSWORD]: { type: String },
  [UserFieldName.NAME]: { type: String, default: "" },
  [UserFieldName.PHONE]: { type: String, default: "" },
  [UserFieldName.ROLE]: {
    type: String,
    enum: UserRoles,
    default: BaseRole.USER,
    required: true,
  },
  [UserFieldName.AVATAR_URL]: { type: String, default: "" },

  [UserFieldName.IS_VERIFIED]: { type: Boolean, default: false },
  [UserFieldName.VERIFICATION_TOKEN]: { type: String },
  [UserFieldName.VERIFICATION_TOKEN_EXPIRES]: { type: Date },
  [UserFieldName.TOKEN_VERSION]: { type: Number, default: 0 },

  [UserFieldName.LAST_RESET_PASSWORD_AT]: { type: Date, default: Date.now },

  ...BaseModelFields,
});

export type UserDocument = HydratedDocument<IUser>;
const UserSchema = mongoose.model<UserDocument>(COLLECTION_NAME.USER, UserSchemaEntity);
export default UserSchema;
