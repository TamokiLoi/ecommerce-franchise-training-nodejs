import { Type } from "class-transformer";
import { IsArray, IsMongoId, IsNotEmpty, IsOptional, IsString, Matches, ValidateNested } from "class-validator";
import { Types } from "mongoose";
import { MSG, REGEX } from "../../../core";

export class CreateShiftAssignmentDto {
  @IsNotEmpty()
  @IsMongoId()
  @Type(() => String)
  shift_id!: Types.ObjectId;

  @IsNotEmpty()
  @IsMongoId()
  @Type(() => String)
  user_id!: Types.ObjectId;

  @IsNotEmpty()
  @Matches(REGEX.DATE_YYYY_MM_DD, { message: MSG.DATE_YYYY_MM_DD })
  work_date!: string;

  @IsOptional()
  @IsString()
  note!: string;

  assigned_by!: Types.ObjectId;
}

export class CreateShiftAssignmentItemsDto {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateShiftAssignmentDto)
  items!: CreateShiftAssignmentDto[];
}
