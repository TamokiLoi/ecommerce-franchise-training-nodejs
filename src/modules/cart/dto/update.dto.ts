import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class UpdateCartDto {
  @IsOptional()
  @IsString()
  address!: string;

  @IsOptional()
  @IsString()
  phone!: string;
}

