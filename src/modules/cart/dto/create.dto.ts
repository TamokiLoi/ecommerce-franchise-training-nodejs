import { Type } from "class-transformer";
import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from "class-validator";

export class CreateCartDto {}

export class AddToCartDto {
  @IsNotEmpty()
  @IsMongoId()
  franchise_id!: string;

  @IsNotEmpty()
  @IsMongoId()
  product_franchise_id!: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  address!: string;

  @IsOptional()
  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  note!: string;

  // optional options
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AddCartItemOptionDto)
  options?: AddCartItemOptionDto[];

  @IsOptional()
  @IsMongoId()
  customer_id!: string;

  @IsOptional()
  @IsMongoId()
  staff_id!: string;
}

export class AddCartItemOptionDto {
  @IsNotEmpty()
  @IsMongoId()
  product_franchise_id!: string; // topping id

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10)
  quantity!: number;
}
