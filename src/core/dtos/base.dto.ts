import { IsBoolean, IsDate } from "class-validator";

export class BaseDto {
  @IsDate()
  public created_at: Date;

  @IsDate()
  public updated_at: Date;

  @IsBoolean()
  public is_deleted: boolean;

  constructor(created_at: Date = new Date(), updated_at: Date = new Date(), is_deleted: boolean = false) {
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.is_deleted = is_deleted;
  }
}
