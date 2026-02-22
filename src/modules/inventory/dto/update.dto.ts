import { Type } from "class-transformer";
import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class UpdateInventoryQuantityDto {
  @IsNotEmpty()
  @IsMongoId()
  product_franchise_id!: string;

  @Type(() => Number)
  @IsNumber()
  change!: number; // + hoặc -

  @IsOptional()
  @IsString()
  reason?: string; // optional, nhưng nên có để log lại lý do điều chỉnh
}

export class UpdateInventoryThresholdDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  alert_threshold!: number;
}
