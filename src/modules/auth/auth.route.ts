import { Router } from "express";
import { API_PATH } from "../../core/constants";
import { IRoute } from "../../core/interfaces";
import { authMiddleware, requireContext, validationMiddleware } from "../../core/middleware";
import AuthController from "./auth.controller";
import { LoginDto, RegisterDto } from "./dto/authCredential.dto";
import ChangePasswordDto from "./dto/changePassword.dto";
import { SwitchContextDto } from "./dto/switchContext.dto";

export default class AuthRoute implements IRoute {
  public path = API_PATH.AUTH;
  public router = Router();

  constructor(private readonly authController: AuthController) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * tags:
     *   - name: Auth
     *     description: Authentication
     */

    // POST domain:/api/auth/register - Register
    this.router.post(API_PATH.AUTH_REGISTER, validationMiddleware(RegisterDto), this.authController.register);

    // POST domain:/api/auth/verify-token -> Verify token for new user
    this.router.post(API_PATH.AUTH_VERIFY_TOKEN, this.authController.verifyUserToken);

    // POST domain:/api/auth/resend-token -> Resend Token via email
    this.router.post(API_PATH.AUTH_RESEND_TOKEN, this.authController.resendToken);

    // POST domain:/api/auth -> Login (auto set cookie)
    this.router.post(this.path, validationMiddleware(LoginDto), this.authController.loginWithCookie);

    // POST domain:/api/auth/login-swagger -> Login via swagger (return token)
    this.router.post(API_PATH.AUTH_LOGIN_SWAGGER, validationMiddleware(LoginDto), this.authController.loginForSwagger);

    // GET domain:/api/auth -> Login User Info
    this.router.get(this.path, authMiddleware(), this.authController.getLoginUserInfo);

    // POST domain:/api/auth/switch-context -> Switch Context
    this.router.post(
      API_PATH.AUTH_SWITCH_CONTEXT,
      authMiddleware(),
      validationMiddleware(SwitchContextDto),
      this.authController.switchContext,
    );

    // GET domain:/api/auth/refresh-token -> Refresh Token
    this.router.get(API_PATH.AUTH_REFRESH_TOKEN, this.authController.refreshToken);

    // POST domain:/api/auth/logout -> Logout
    this.router.post(API_PATH.AUTH_LOGOUT, authMiddleware(), this.authController.logout);

    // PUT domain:/api/auth/forgot-password -> Forgot password
    this.router.put(API_PATH.AUTH_FORGOT_PASSWORD, this.authController.forgotPassword);

    // PUT domain:/api/auth/change-password -> Forgot password
    this.router.put(
      API_PATH.AUTH_CHANGE_PASSWORD,
      authMiddleware(),
      validationMiddleware(ChangePasswordDto),
      this.authController.changePassword,
    );
  }
}
