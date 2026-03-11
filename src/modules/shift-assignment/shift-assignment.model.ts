import mongoose, { HydratedDocument, Schema, Types } from "mongoose";
import { BASE_MODEL_FIELDS_NO_ACTIVE } from "../../core";
import { COLLECTION_NAME } from "../../core/constants";
import { IShiftAssignment } from "./shift-assignment.interface";
import { BaseFieldName, ShiftAssignmentStatus } from "../../core/enums/base.enum";

const ShiftAssignmentSchemaEntity = new Schema({
  [BaseFieldName.SHIFT_ID]: { type: Types.ObjectId, ref: COLLECTION_NAME.SHIFT, required: true, index: true },
  [BaseFieldName.USER_ID]: { type: Types.ObjectId, ref: COLLECTION_NAME.USER, required: true, index: true },
  [BaseFieldName.WORK_DATE]: { type: String, required: true, index: true },
  [BaseFieldName.ASSIGNED_BY]: { type: Types.ObjectId, ref: COLLECTION_NAME.USER, required: true },
  [BaseFieldName.NOTE]: { type: String, required: false },
  [BaseFieldName.STATUS]: {
    type: String,
    enum: Object.values(ShiftAssignmentStatus),
    default: ShiftAssignmentStatus.ASSIGNED,
    required: true,
  },
  ...BASE_MODEL_FIELDS_NO_ACTIVE,
});

ShiftAssignmentSchemaEntity.index(
  {
    [BaseFieldName.USER_ID]: 1,
    [BaseFieldName.WORK_DATE]: 1,
    [BaseFieldName.SHIFT_ID]: 1,
  },
  { unique: true },
);

ShiftAssignmentSchemaEntity.index(
  {
    [BaseFieldName.WORK_DATE]: 1,
    [BaseFieldName.SHIFT_ID]: 1,
  },
  {
    unique: true,
    partialFilterExpression: { is_deleted: false },
  },
);

ShiftAssignmentSchemaEntity.index(
  {
    [BaseFieldName.USER_ID]: 1,
    [BaseFieldName.WORK_DATE]: 1,
  },
  {
    unique: true,
    partialFilterExpression: { is_deleted: false },
  },
);

export type ShiftAssignmentDocument = HydratedDocument<IShiftAssignment>;
const ShiftAssignmentSchema = mongoose.model<ShiftAssignmentDocument>(
  COLLECTION_NAME.SHIFT_ASSIGNMENT,
  ShiftAssignmentSchemaEntity,
);
export default ShiftAssignmentSchema;
