import { IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";
import { MSG, REGEX } from "../../../core/constants";

export default class CreateFranchiseDto {
  @IsNotEmpty()
  @IsString()
  public code!: string;

  @IsNotEmpty()
  @IsString()
  public name!: string;

  @IsNotEmpty()
  @Matches(REGEX.TIME_HH_MM, { message: MSG.TIME_HH_MM })
  public opened_at!: string;

  @IsNotEmpty()
  @Matches(REGEX.TIME_HH_MM, { message: MSG.TIME_HH_MM })
  public closed_at!: string;

  @IsOptional()
  @IsString()
  public hotline?: string;

  @IsOptional()
  @IsString()
  public logo_url?: string;

  @IsOptional()
  @IsString()
  public address?: string;

  @IsOptional()
  @IsString()
  public google_map_url?: string;
}
