import { IsString, IsBoolean, IsOptional, Matches } from "class-validator";
import { MSG, REGEX } from "../../../core";

export default class UpdateShiftDto {

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Matches(REGEX.TIME_HH_MM, { message: MSG.TIME_HH_MM })
  start_time?: string;

  @IsOptional()
  @Matches(REGEX.TIME_HH_MM, { message: MSG.TIME_HH_MM })
  end_time?: string;
}