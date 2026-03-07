import mongoose, { HydratedDocument, Schema, Types } from "mongoose";
import { BaseFieldName } from "../../core/enums";
import { ShiftFieldName } from "./shift.enum";
import { BASE_MODEL_FIELDS } from "../../core";
import { COLLECTION_NAME } from "../../core/constants";
import { IShift } from "./shift.interface";


const ShiftSchemaEntity = new Schema({
    [BaseFieldName.FRANCHISE_ID]: { type: Types.ObjectId, ref:COLLECTION_NAME.FRANCHISE,required: true },
    [BaseFieldName.NAME]: { type: String, required: true },
    [ShiftFieldName.START_TIME]: { type: String, required: true },
    [ShiftFieldName.END_TIME]: { type: String, required: true },
    ...BASE_MODEL_FIELDS,
})

export type ShiftDocument = HydratedDocument<IShift>;
const ShiftSchema = mongoose.model<ShiftDocument>(COLLECTION_NAME.SHIFT, ShiftSchemaEntity);
export default ShiftSchema;