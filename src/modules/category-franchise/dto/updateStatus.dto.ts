import { IsBoolean } from "class-validator";

export default class UpdateStatusDto {
  @IsBoolean()
  is_active: boolean;

  constructor(is_active: boolean) {
    this.is_active = is_active;
  }
}
