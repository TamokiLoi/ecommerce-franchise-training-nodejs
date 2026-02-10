import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export default class SortCategoryFranchiseDto {
  @IsNotEmpty()
  @IsString()
  franchise_id: string;

  @IsNotEmpty()
  @IsString()
  category_franchise_id: string;

  @IsOptional()
  @IsNumber()
  display_order?: number;

  constructor(franchise_id: string, category_franchise_id: string, display_order?: number) {
    this.franchise_id = franchise_id;
    this.category_franchise_id = category_franchise_id;
    this.display_order = display_order;
  }
}
