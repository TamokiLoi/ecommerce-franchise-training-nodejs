import { IsMongoId, IsNotEmpty, IsString, Matches } from "class-validator";
import { MSG, REGEX } from "../../../core";

export default class CreateShiftDto {
  @IsNotEmpty()
  @IsMongoId()
  franchise_id!: string;

  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @Matches(REGEX.TIME_HH_MM, { message: MSG.TIME_HH_MM })
  start_time!: string;

  @IsNotEmpty()
  @Matches(REGEX.TIME_HH_MM, { message: MSG.TIME_HH_MM })
  end_time!: string;
}
