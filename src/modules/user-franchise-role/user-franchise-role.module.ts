import { BaseModule } from "../../core/modules";
import { AuditLogModule } from "../audit-log";
import { FranchiseModule } from "../franchise";
import { RoleModule } from "../role";
import { UserModule } from "../user";
import UserFranchiseRoleController from "./user-franchise-role.controller";
import { IUserFranchiseRoleQuery } from "./user-franchise-role.interface";
import { UserFranchiseRoleRepository } from "./user-franchise-role.repository";
import UserFranchiseRoleRoute from "./user-franchise-role.route";
import UserFranchiseRoleService from "./user-franchise-role.service";

export class UserFranchiseRoleModule extends BaseModule<UserFranchiseRoleRoute> {
  private readonly userContextProvider: IUserFranchiseRoleQuery;

  constructor(userModule: UserModule, roleModule: RoleModule, franchiseModule: FranchiseModule) {
    super();

    // ===== External domain dependencies =====
    const userQuery = userModule.getUserQuery();
    const roleQuery = roleModule.getRoleQuery();
    const franchiseQuery = franchiseModule.getFranchiseQuery();

    // ===== Internal dependencies =====
    const auditLogModule = new AuditLogModule();
    const repo = new UserFranchiseRoleRepository();

    // ===== Core service =====
    const service = new UserFranchiseRoleService(
      repo,
      auditLogModule.getAuditLogger(),
      userQuery,
      roleQuery,
      franchiseQuery,
    );

    // ===== HTTP layer =====
    const controller = new UserFranchiseRoleController(service);
    this.route = new UserFranchiseRoleRoute(controller);

    // ===== Expose ONLY interface =====
    this.userContextProvider = service;
  }

  public getUserContext(): IUserFranchiseRoleQuery {
    return this.userContextProvider;
  }
}
