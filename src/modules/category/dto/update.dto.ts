import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export default class UpdateCategoryDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  parent_id?: string;

  constructor(code: string, name: string, description?: string, parent_id?: string) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.parent_id = parent_id;
  }
}
