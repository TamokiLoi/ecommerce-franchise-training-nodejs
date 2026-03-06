import { Type } from "class-transformer";
import {
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from "class-validator";
import { PromotionType } from "../promotion.enum";

export class CreatePromotionDto {
  @IsNotEmpty()
  @IsMongoId()
  franchise_id!: string;

  @IsOptional()
  @IsMongoId()
  product_franchise_id?: string;

  @IsNotEmpty()
  @IsEnum(PromotionType)
  type!: PromotionType;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  value!: number;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  start_date!: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  end_date!: Date;

  created_by?: string;
}
