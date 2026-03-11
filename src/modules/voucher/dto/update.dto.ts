import { Type } from "class-transformer";
import {
    IsDate,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    Min
} from "class-validator";
import { VoucherType } from "../voucher.enum";

export class UpdateVoucherDto {  
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(VoucherType)
  type?: VoucherType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  value?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quota_total?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  start_date?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  end_date?: Date;
}
