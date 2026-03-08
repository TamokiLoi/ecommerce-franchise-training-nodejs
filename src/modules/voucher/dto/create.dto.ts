import { Type } from "class-transformer";
import {
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { VoucherType } from "../voucher.enum";

export class CreateVoucherDto {
  @IsNotEmpty()
  @IsString()
  code!: string;

  @IsNotEmpty()
  @IsMongoId()
  franchise_id!: string;

  @IsOptional()
  @IsMongoId()
  product_franchise_id?: string;

  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsEnum(VoucherType)
  type!: VoucherType;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  value!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quota_total!: number;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  start_date!: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  end_date!: Date;

  @IsOptional()
  created_by?: string;
}
