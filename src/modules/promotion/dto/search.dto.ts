import { Transform, Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  Min,
} from "class-validator";
import {
  BaseSearchItemDto,
  SearchPaginationRequestModel,
} from "../../../core/models";
import { PromotionType } from "../promotion.enum";

export class SearchItemDto extends BaseSearchItemDto {
  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsMongoId()
  franchise_id?: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsMongoId()
  product_franchise_id?: string;

  @IsOptional()
  @IsEnum(PromotionType)
  type?: PromotionType;

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
  start_date?: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsDateString()
  end_date?: string;
}

export class SearchPaginationItemDto extends SearchPaginationRequestModel<SearchItemDto> {
  @Type(() => SearchItemDto)
  public searchCondition!: SearchItemDto;
}
