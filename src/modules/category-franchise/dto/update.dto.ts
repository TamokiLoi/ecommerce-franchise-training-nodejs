import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export default class UpdateCategoryFranchiseDto {
  @IsNotEmpty()
  @IsString()
  franchise_id: string;

  @IsNotEmpty()
  @IsString()
  category_id: string;

  @IsOptional()
  @IsNumber()
  display_order?: number;

  constructor(franchise_id: string, category_id: string, display_order?: number) {
    this.franchise_id = franchise_id;
    this.category_id = category_id;
    this.display_order = display_order;
  }
}
