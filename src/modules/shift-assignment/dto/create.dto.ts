import { Type } from "class-transformer";
import { Types } from "mongoose";
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from "class-validator";

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
  @IsString()
  work_date!: string;

  @IsNotEmpty()
  @IsMongoId()
  @Type(() => String)
  assigned_by!: Types.ObjectId;
}

export class CreateShiftAssignmentItemsDto {

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateShiftAssignmentDto)
  items!: CreateShiftAssignmentDto[];

}