import mongoose, { HydratedDocument, Schema, Types } from "mongoose";
import { BaseFieldName } from "../../core/enums";
import { ShiftFieldName } from "./shift.enum";
import { BaseModelFields } from "../../core";
import { COLLECTION_NAME } from "../../core/constants";
import { IShift } from "./shift.interface";


const ShiftSchemaEntity = new Schema({
    [BaseFieldName.NAME]: { type: String, required: true },
    [ShiftFieldName.START_TIME]: { type: String, required: true },
    [ShiftFieldName.END_TIME]: { type: String, required: true },
    [BaseFieldName.FRANCHISE_ID]: { type: Types.ObjectId, ref:COLLECTION_NAME.FRANCHISE,required: true },
    ...BaseModelFields,
})

export type ShiftDocument = HydratedDocument<IShift>;
const ShiftSchema = mongoose.model<ShiftDocument>(COLLECTION_NAME.SHIFT, ShiftSchemaEntity);
export default ShiftSchema;