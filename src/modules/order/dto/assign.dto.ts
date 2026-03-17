import { IsMongoId, IsNotEmpty } from "class-validator";

export class AssignShipperDto {
  @IsNotEmpty()
  @IsMongoId()
  public staff_id!: string;
}
