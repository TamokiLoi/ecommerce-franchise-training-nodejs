import { IsOptional,IsString } from "class-validator";
import { BaseSearchItemDto, SearchPaginationRequestModel } from "../../../core";
import { Type } from "class-transformer";
export class SearchItemDto  extends BaseSearchItemDto{
     @IsOptional()
     @IsString()
     public keyword?: string; //  name

     @IsOptional()
     @IsString()
     public franshise_id?: string;

     @IsOptional()
     @IsString()
     public start_time?: string;

     @IsOptional()
     @IsString()
     public end_time?: string;
     
}

export class SearchPaginationItemDto extends SearchPaginationRequestModel<SearchItemDto> {
  @Type(() => SearchItemDto)
  public searchCondition!: SearchItemDto;
}
