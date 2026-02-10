import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested } from "class-validator";

export class UpdateDisplayOrderItemDto {
  @IsString()
  id!: string;

  @IsNumber()
  display_order!: number;
}

export class UpdateDisplayOrderItemsDto {
  @IsNotEmpty()
  @IsString()
  franchise_id!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateDisplayOrderItemDto)
  items!: UpdateDisplayOrderItemDto[];
}
