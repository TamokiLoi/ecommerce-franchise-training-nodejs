import { ICustomerQuery } from "../customer";
import { ICustomerFranchiseQuery } from "../customer-franchise";

export class DashboardService {
  constructor(
    private readonly customerQuery: ICustomerQuery,
    private readonly customerFranchiseQuery: ICustomerFranchiseQuery,
  ) {}

  public async getDashboardInfo(franchiseId?: string) {
    const countCustomers = await this.countCustomers();
    const countCustomerFranchises = await this.countCustomerFranchises(franchiseId);
    return {
      countCustomers,
      countCustomerFranchises,
    };
  }

  private async countCustomers() {
    return this.customerQuery.countCustomers();
  }

  private async countCustomerFranchises(franchiseId?: string): Promise<number> {
    return this.customerFranchiseQuery.countCustomerFranchises(franchiseId);
  }
}
