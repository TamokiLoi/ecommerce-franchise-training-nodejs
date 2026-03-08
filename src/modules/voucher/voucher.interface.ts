import { Document, Types } from "mongoose";
import { BaseFieldName } from "../../core/enums";
import { IBase } from "../../core/interfaces";
import { VoucherFieldName, VoucherType } from "./voucher.enum";

export interface IVoucher extends Document, IBase {
  [VoucherFieldName.CODE]: string;
  [BaseFieldName.FRANCHISE_ID]: Types.ObjectId;
  [VoucherFieldName.PRODUCT_FRANCHISE_ID]?: Types.ObjectId;
  [VoucherFieldName.NAME]: string;
  [VoucherFieldName.DESCRIPTION]: string;
  [VoucherFieldName.TYPE]: VoucherType;
  [VoucherFieldName.VALUE]: number;
  [VoucherFieldName.QUOTA_TOTAL]: number;
  [VoucherFieldName.QUOTA_USED]: number;
  [VoucherFieldName.START_DATE]: Date;
  [VoucherFieldName.END_DATE]: Date;
  [BaseFieldName.CREATED_BY]: Types.ObjectId;
  [BaseFieldName.IS_ACTIVE]: boolean;
  [BaseFieldName.IS_DELETED]: boolean;
}

export interface IVoucherQuery {
  getById(id: string): Promise<IVoucher | null>;
}
