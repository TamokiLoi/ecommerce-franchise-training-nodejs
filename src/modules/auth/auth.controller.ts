import { NextFunction, Request, Response } from "express";
import { HttpStatus } from "../../core/enums";
import { formatResponse } from "../../core/utils";
import { IUser, mapUserToResponse, UserResponseDto } from "../user";
import AuthService from "./auth.service";
import { RegisterDto } from "./dto/authCredential";

export default class AuthController {
  constructor(private readonly authService: AuthService) {}

  public register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const model: RegisterDto = req.body;
      // TODO: check domain set group-id
      console.log("🚀 ~ AuthController ~ req.get('Origin'):", req.get("Origin"));
      const item = await this.authService.register(model);
      res.status(HttpStatus.Success).json(formatResponse<IUser>(item));
    } catch (error) {
      next(error);
    }
  };

  public verifyCreateUserToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.authService.verifyCreateUserToken(req.body.token);
      res.status(HttpStatus.Success).json(formatResponse<null>(null));
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.authService.login(req.body, res);
      res.status(HttpStatus.Success).json(formatResponse<null>(null));
    } catch (error) {
      next(error);
    }
  };

  public getLoginUserInfo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user: IUser = await this.authService.getLoginUserInfo(req.user.id);
      res.status(HttpStatus.Success).json(formatResponse<UserResponseDto>(mapUserToResponse(user)));
    } catch (error) {
      next(error);
    }
  };
}
