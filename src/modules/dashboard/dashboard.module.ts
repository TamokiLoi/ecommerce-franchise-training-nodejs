import { BaseModule } from "../../core";
import { CustomerModule } from "../customer";
import { CustomerFranchiseModule } from "../customer-franchise";
import { DashboardController } from "./dashboard.controller";
import DashboardRoute from "./dashboard.route";
import { DashboardService } from "./dashboard.service";

export class DashboardModule extends BaseModule<DashboardRoute> {
  constructor(customerModule: CustomerModule, customerFranchiseModule: CustomerFranchiseModule) {
    super();

    // ===== External dependencies =====
    const customerQuery = customerModule.getCustomerQuery();
    const customerFranchiseQuery = customerFranchiseModule.getCustomerFranchiseQuery();

    // ===== Internal dependencies =====

    // Core service and Http layer
    const service = new DashboardService(customerQuery, customerFranchiseQuery);
    const controller = new DashboardController(service);
    this.route = new DashboardRoute(controller);
  }
}
