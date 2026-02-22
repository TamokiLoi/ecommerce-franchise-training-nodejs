import { Type } from "class-transformer";
import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, Min } from "class-validator";

export class CreateInventoryDto {
  @IsNotEmpty()
  @IsMongoId()
  product_franchise_id!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  alert_threshold?: number;
}
