import { IsEnum, IsNotEmpty } from "class-validator";
import { ShiftAssignmentStatus } from "../../../core/enums/base.enum";
export class UpdateStatusDto {
     @IsNotEmpty()
     @IsEnum(ShiftAssignmentStatus)
     status!: ShiftAssignmentStatus;
}
