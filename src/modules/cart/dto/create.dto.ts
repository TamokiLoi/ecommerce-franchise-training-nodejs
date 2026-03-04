import { Type } from "class-transformer";
import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, Min, ValidateNested } from "class-validator";

export class CreateCartDto {
  @IsNotEmpty()
  @IsMongoId()
  public franchise_id!: string;

  @IsNotEmpty()
  @IsMongoId()
  public customer_id!: string;

  @IsOptional()
  @IsMongoId()
  public staff_id?: string;

  // --- For Cart Item ---
  @IsNotEmpty()
  @IsMongoId()
  public product_franchise_id!: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  public quantity!: number;
}

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
  quantity!: number;
}
