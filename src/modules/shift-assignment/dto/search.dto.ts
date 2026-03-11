import { Transform, Type } from "class-transformer";
import { IsBoolean, IsEnum, IsMongoId, IsOptional, Matches } from "class-validator";
import { MSG, REGEX, SearchPaginationRequestModel, ShiftAssignmentStatus } from "../../../core";

export class SearchItemDto {
  @IsOptional()
  @IsMongoId()
  shift_id?: string;

  @IsOptional()
  @IsMongoId()
  user_id?: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @Matches(REGEX.DATE_YYYY_MM_DD, { message: MSG.DATE_YYYY_MM_DD })
  work_date?: string;

  @IsOptional()
  @IsMongoId()
  assigned_by?: string;

  @IsOptional()
  @IsEnum(ShiftAssignmentStatus)
  status?: ShiftAssignmentStatus;

  @IsOptional()
  @IsBoolean()
  is_deleted?: boolean;

  constructor(
    shift_id?: string,
    user_id?: string,
    work_date?: string,
    assigned_by?: string,
    status?: ShiftAssignmentStatus,
    is_deleted?: boolean,
  ) {
    this.shift_id = shift_id;
    this.user_id = user_id;
    this.work_date = work_date;
    this.assigned_by = assigned_by;
    this.status = status;
    this.is_deleted = is_deleted;
  }
}

export class SearchPaginationItemDto extends SearchPaginationRequestModel<SearchItemDto> {
  @Type(() => SearchItemDto)
  public searchCondition!: SearchItemDto;
}
