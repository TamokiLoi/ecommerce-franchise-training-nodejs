import { Transform, Type } from "class-transformer";
import { IsDateString, IsEnum, IsMongoId, IsNumber, IsOptional, Min } from "class-validator";
import { BaseLoyaltyTier, BaseSearchItemDto, SearchPaginationRequestModel } from "../../../core";

export class SearchItemDto extends BaseSearchItemDto {
  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsMongoId()
  franchise_id?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === "" || value === undefined) return undefined;
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
  })
  @IsNumber()
  @Min(0)
  earn_amount_per_point?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === "" || value === undefined) return undefined;
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
  })
  @IsNumber()
  @Min(0)
  redeem_value_per_point?: number;

  @IsOptional()
  @IsEnum(BaseLoyaltyTier)
  tier?: BaseLoyaltyTier;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsDateString()
  created_from?: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsDateString()
  created_to?: string;
}

export class SearchPaginationItemDto extends SearchPaginationRequestModel<SearchItemDto> {
  @Type(() => SearchItemDto)
  public searchCondition!: SearchItemDto;
}
