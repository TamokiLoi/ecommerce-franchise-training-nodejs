import { CookieOptions, NextFunction, Request, Response } from "express";
import { HttpStatus } from "../../core/enums";
import { formatResponse } from "../../core/utils";
import { IUser } from "../user";
import { AUTH_CONFIG, TOKEN } from "./auth.config";
import { mapAuthToResponse } from "./auth.mapper";
import AuthService from "./auth.service";
import { RegisterDto } from "./dto/authCredential.dto";
import { AuthResponseDto } from "./dto/authResponse.dto";
import ChangePasswordDto from "./dto/changePassword.dto";

export default class AuthController {
  constructor(private readonly authService: AuthService) {}

  public register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const model: RegisterDto = req.body;
      const item = await this.authService.register(model, req.get("Origin"));
      res.status(HttpStatus.Success).json(formatResponse<IUser>(item));
    } catch (error) {
      next(error);
    }
  };

  public verifyUserToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.authService.verifyUserToken(req.body.token);
      res.status(HttpStatus.Success).json(formatResponse<null>(null));
    } catch (error) {
      next(error);
    }
  };

  public resendToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.authService.resendToken(req.body.email, req.get("Origin"));
      res.status(HttpStatus.Success).json(formatResponse<null>(null));
    } catch (error) {
      next(error);
    }
  };

  public loginWithCookie = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokens = await this.authService.login(req.body);
      const { accessToken, refreshToken } = tokens;

      // 🔥 Set cookies
      res.cookie(TOKEN.ACCESS_TOKEN, accessToken, {
        ...this.baseCookieOptions,
        maxAge: AUTH_CONFIG.ACCESS_COOKIE_MAX_AGE,
      });
      res.cookie(TOKEN.REFRESH_TOKEN, refreshToken, {
        ...this.baseCookieOptions,
        maxAge: AUTH_CONFIG.REFRESH_COOKIE_MAX_AGE,
      });

      res.status(HttpStatus.Success).json(formatResponse<null>(null));
    } catch (error) {
      next(error);
    }
  };

  public loginForSwagger = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokens = await this.authService.login(req.body);
      return res.status(HttpStatus.Success).json(formatResponse(tokens));
    } catch (error) {
      next(error);
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.authService.logout(req.user.id);

      // 🔥 Clear cookies
      res.clearCookie(TOKEN.ACCESS_TOKEN, this.baseCookieOptions);
      res.clearCookie(TOKEN.REFRESH_TOKEN, this.baseCookieOptions);

      return res.status(HttpStatus.Success).json(formatResponse<null>(null));
    } catch (error) {
      next(error);
    }
  };

  public getLoginUserInfo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user, contexts } = await this.authService.getLoginUserInfo(req.user.id);

      res.status(HttpStatus.Success).json(formatResponse<AuthResponseDto>(mapAuthToResponse(user, contexts)));
    } catch (error) {
      next(error);
    }
  };

  public forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.authService.forgotPassword(req.body.email);
      res.status(HttpStatus.Success).json(formatResponse<null>(null));
    } catch (error) {
      next(error);
    }
  };

  public changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const model: ChangePasswordDto = req.body;
      await this.authService.changePassword(model, req.user);
      res.status(HttpStatus.Success).json(formatResponse<null>(null));
    } catch (error) {
      next(error);
    }
  };

  // ===== PRIVATE HELPERS =====

  private readonly baseCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };
}
