import mongoose, { Schema } from "mongoose";
import { COLLECTION_NAME } from "../../core/constants";
import { BaseModelFields } from "../../core/models";
import { UserFieldName } from "./user.enum";
import { IUser } from "./user.interface";

const UserSchemaEntity: Schema<IUser> = new Schema({
  [UserFieldName.EMAIL]: { type: String, unique: true, index: true },
  [UserFieldName.PASSWORD]: { type: String },
  [UserFieldName.USER_NAME]: { type: String },
  [UserFieldName.ROLE]: { type: String },

  [UserFieldName.IS_VERIFIED]: { type: Boolean, default: false },
  [UserFieldName.VERIFICATION_TOKEN]: { type: String },
  [UserFieldName.VERIFICATION_TOKEN_EXPIRES]: { type: Date },
  [UserFieldName.TOKEN_VERSION]: { type: Number },

  [UserFieldName.IS_BLOCKED]: { type: Boolean, default: false },

  ...BaseModelFields,
});

const UserSchema = mongoose.model<IUser & mongoose.Document>(COLLECTION_NAME.USER, UserSchemaEntity);
export default UserSchema;
