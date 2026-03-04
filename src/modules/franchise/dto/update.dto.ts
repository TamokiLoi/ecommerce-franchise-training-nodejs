import { IsOptional, IsString, Matches } from "class-validator";
import { MSG, REGEX } from "../../../core/constants";

export default class UpdateFranchiseDto {
  @IsOptional()
  @IsString()
  public code?: string;

  @IsOptional()
  @IsString()
  public name?: string;

  @IsOptional()
  @Matches(REGEX.TIME_HH_MM, { message: MSG.TIME_HH_MM })
  public opened_at?: string;

  @IsOptional()
  @Matches(REGEX.TIME_HH_MM, { message: MSG.TIME_HH_MM })
  public closed_at?: string;

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
