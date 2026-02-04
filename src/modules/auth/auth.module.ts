import { BaseModule } from "../../core/modules";
import { MailService } from "../../core/services";
import { UserModule } from "../user";

import AuthController from "./auth.controller";
import AuthRoute from "./auth.route";
import AuthService from "./auth.service";

export class AuthModule extends BaseModule<AuthRoute> {
  constructor() {
    super();

    const userModule = new UserModule();
    const mailService = new MailService();
    const authService = new AuthService(userModule.getUserValidation(), userModule.getUserQuery(), mailService);
    const authController = new AuthController(authService);

    this.route = new AuthRoute(authController);
  }
}
