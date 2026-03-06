import { BaseModule } from "../../core/modules";
import { AuditLogModule } from "../audit-log";
import { VoucherController } from "./voucher.controller";
import { IVoucherQuery } from "./voucher.interface";
import { VoucherRepository } from "./voucher.repository";
import VoucherRoute from "./voucher.route";
import { VoucherService } from "./voucher.service";

export class VoucherModule extends BaseModule<VoucherRoute> {
  private readonly voucherQuery: IVoucherQuery;

  constructor() {
    super();

    const auditLogModule = new AuditLogModule();
    const repo = new VoucherRepository();

    const service = new VoucherService(repo, auditLogModule.getAuditLogger());
    const controller = new VoucherController(service);
    this.route = new VoucherRoute(controller);

    this.voucherQuery = service;
  }

  public getVoucherQuery(): IVoucherQuery {
    return this.voucherQuery;
  }
}
