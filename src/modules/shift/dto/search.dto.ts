import { IsOptional,IsString, Matches } from "class-validator";
import { BaseSearchItemDto, MSG, REGEX, SearchPaginationRequestModel } from "../../../core";
import { Transform, Type } from "class-transformer";
export class SearchItemDto  extends BaseSearchItemDto{
     @IsOptional()
     @IsString()
     public name?: string; 

     @IsOptional()
     @IsString()
     public franchise_id?: string;

     @IsOptional()
     @Transform(({ value }) => (value === "" ? undefined : value))
     @Matches(REGEX.TIME_HH_MM, { message: MSG.TIME_HH_MM })
     public start_time?: string;

     @IsOptional()
     @Transform(({ value }) => (value === "" ? undefined : value))
     @Matches(REGEX.TIME_HH_MM, { message: MSG.TIME_HH_MM })
     public end_time?: string;

}

export class SearchPaginationItemDto extends SearchPaginationRequestModel<SearchItemDto> {
  @Type(() => SearchItemDto)
  public searchCondition!: SearchItemDto;
}
