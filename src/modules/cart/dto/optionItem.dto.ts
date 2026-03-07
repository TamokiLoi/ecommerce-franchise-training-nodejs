import { Type } from "class-transformer";
import { IsMongoId, IsNotEmpty, IsNumber, Min } from "class-validator";

export class UpdateQuantityOptionItemDto {
  @IsNotEmpty()
  @IsMongoId()
  cart_item_id!: string;

  @IsNotEmpty()
  @IsMongoId()
  option_product_franchise_id!: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class RemoveOptionItemDto {
  @IsNotEmpty()
  @IsMongoId()
  cart_item_id!: string;

  @IsNotEmpty()
  @IsMongoId()
  option_product_franchise_id!: string;
}
