import { Document, Types } from "mongoose";
import { IBase } from "../../core/interfaces/base.interface";
import { BaseFieldName } from "../../core/enums";
import { ShiftFieldName } from "./shift.enum";

export interface IShift extends Document, IBase {
  [BaseFieldName.NAME]: string;
  [BaseFieldName.FRANCHISE_ID]: Types.ObjectId;
  [BaseFieldName.IS_ACTIVE]: boolean;
  [BaseFieldName.IS_DELETED]: boolean;
  [ShiftFieldName.START_TIME]: string;
  [ShiftFieldName.END_TIME]: string;
}

export interface IShiftQuery {
  getById(id: string): Promise<IShift | null>;
}