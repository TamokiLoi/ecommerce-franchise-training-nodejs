import { Transform, Type } from "class-transformer";
import { IsDateString, IsEnum, IsMongoId, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { BaseSearchItemDto, SearchPaginationRequestModel } from "../../../core/models";
import { VoucherType } from "../voucher.enum";

export class SearchItemDto extends BaseSearchItemDto {
  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsString()
  code?: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsMongoId()
  franchise_id?: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsMongoId()
  product_franchise_id?: string;

  @IsOptional()
  @IsEnum(VoucherType)
  type?: VoucherType;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === "") {
      return undefined;
    }
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
  })
  @IsNumber()
  @Min(0)
  value?: number;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsDateString()
  start_date?: Date;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsDateString()
  end_date?: Date;
}

export class SearchPaginationItemDto extends SearchPaginationRequestModel<SearchItemDto> {
  @Type(() => SearchItemDto)
  public searchCondition!: SearchItemDto;
}
