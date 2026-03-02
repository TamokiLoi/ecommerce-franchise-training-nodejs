import { BaseModule } from "../../core";
import { AuditLogModule } from "../audit-log";
import { ShiftController } from "./shift.controller";
import { IShiftQuery } from "./shift.interface";
import { ShiftRepository } from "./shift.repository";
import ShiftRoute from "./shift.route";
import { ShiftService } from "./shift.service";

export class ShiftModule extends BaseModule<ShiftRoute> {
  private readonly shiftQuery: IShiftQuery;

  constructor() {
    super();

    // ===== Internal dependencies =====
    const auditLogModule = new AuditLogModule();
    const repo = new ShiftRepository();

    // Core service and Http layer
    const service = new ShiftService(repo, auditLogModule.getAuditLogger());
    const controller = new ShiftController(service);
    this.route = new ShiftRoute(controller);
    console.log("DEBUG: ShiftModule initialized");

    this.shiftQuery = service;
  }

  public getShiftQuery(): IShiftQuery {
    return this.shiftQuery;
  }
}
