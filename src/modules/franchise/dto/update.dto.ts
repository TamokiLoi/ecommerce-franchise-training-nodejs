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

  constructor(
    code?: string,
    name?: string,
    opened_at?: string,
    closed_at?: string,
    hotline?: string,
    logo_url?: string,
    address?: string,
  ) {
    this.code = code;
    this.name = name;
    this.opened_at = opened_at;
    this.closed_at = closed_at;
    this.hotline = hotline;
    this.logo_url = logo_url;
    this.address = address;
  }
}
