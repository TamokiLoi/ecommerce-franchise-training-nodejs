import { BaseModule } from "../../core";
import { AuditLogModule } from "../audit-log";
import { ShiftAssignmentController } from "./shift-assignment.controller";
import { ShiftAssignmentRepository } from "./shift-assignment.repository";;
import { ShiftAssignmentService } from "./shift-assignment.service";
import { UserModule } from "../user";
import { ShiftModule } from "../shift/shift.module";
import { UserFranchiseRoleModule } from "../user-franchise-role/user-franchise-role.module";
import { IShiftAssignmentQuery } from "./shift-assignment.interface";
import { IShiftQuery } from "../shift/shift.interface";
import {AuthModule} from "../auth/auth.module";
import ShiftAssignmentRoute from "./shift-assignment.route";
export class ShiftAssignmentModule extends BaseModule<ShiftAssignmentRoute> {
  private readonly shiftAssignmentQuery: IShiftAssignmentQuery;
  constructor(userModule: UserModule, shiftModule: ShiftModule, userFranchiseRoleModule: UserFranchiseRoleModule) {
    super();

    // ===== Internal dependencies =====
    const auditLogModule = new AuditLogModule();
    const repo = new ShiftAssignmentRepository();
    const shiftQuery = shiftModule.getShiftQuery();
    const userQuery = userModule.getUserQuery();
    const userFranchiseRoleQuery = userFranchiseRoleModule.getUserContext();

    // Core service
    const service = new ShiftAssignmentService(
      repo,
      shiftQuery,
      userQuery,
      userFranchiseRoleQuery,
      auditLogModule.getAuditLogger(),
    );
    // http Layer
    const controller = new ShiftAssignmentController(service);
    this.route = new ShiftAssignmentRoute(controller);
    this.shiftAssignmentQuery = service;
  }

  public getShiftAssignmentQuery(): IShiftAssignmentQuery {
    return this.shiftAssignmentQuery;
  }
}
