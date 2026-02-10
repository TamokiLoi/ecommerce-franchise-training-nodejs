import { BaseModule } from "../../core/modules";
import { MailService } from "../../core/services";
import { UserModule } from "../user";
import { UserFranchiseRoleModule } from "../user-franchise-role";
import AuthController from "./auth.controller";
import AuthRoute from "./auth.route";
import AuthService from "./auth.service";

export class AuthModule extends BaseModule<AuthRoute> {
  constructor(userFranchiseRoleModule: UserFranchiseRoleModule, userModule: UserModule) {
    super();

    // ===== External domain dependencies =====
    const userContext = userFranchiseRoleModule.getUserContext();
    const userQuery = userModule.getUserQuery();
    const userValidation = userModule.getUserValidation();

    // Internal dependencies
    const mailService = new MailService();

    // Core service and HTTP layer
    const service = new AuthService(userContext, userValidation, userQuery, mailService);
    const controller = new AuthController(service);
    this.route = new AuthRoute(controller);
  }
}
