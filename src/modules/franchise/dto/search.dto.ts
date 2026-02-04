import { Transform, Type } from "class-transformer";
import { IsBoolean, IsOptional, IsString, Matches } from "class-validator";
import { MSG, REGEX } from "../../../core/constants";
import { SearchPaginationRequestModel } from "../../../core/models";
import { PaginationRequestModel } from "../../../core/models/pagination.model";

export class SearchItemDto {
  @IsOptional()
  @IsString()
  public keyword?: string; // code, name

  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @Matches(REGEX.TIME_HH_MM, { message: MSG.TIME_HH_MM })
  public opened_at?: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @Matches(REGEX.TIME_HH_MM, { message: MSG.TIME_HH_MM })
  public closed_at?: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value === "true" ? true : value === "false" ? false : value))
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => (value === "" ? undefined : value === "true" ? true : value === "false" ? false : value))
  public is_deleted?: boolean;
}

export class SearchPaginationItemDto extends SearchPaginationRequestModel<SearchItemDto> {
  //   constructor(pageInfo: PaginationRequestModel, searchCondition: SearchItemDto) {
  //     super(pageInfo, searchCondition);
  //   }

  @Type(() => SearchItemDto)
  public searchCondition!: SearchItemDto;
}
