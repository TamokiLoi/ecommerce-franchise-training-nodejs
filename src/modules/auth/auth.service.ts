import { Response } from "express";
import { BaseGroup } from "../../core/enums";
import { MailService, MailTemplate } from "../../core/services";
import { checkEmptyObject, encodePassword, withTransaction } from "../../core/utils";
import { createTokenVerifiedUser } from "../../core/utils/helpers";
import { IUser, IUserQuery, IUserValidation } from "../user";
import { LoginDto, RegisterDto } from "./dto/authCredential";
import jwt from "jsonwebtoken";

export default class AuthService {
  constructor(
    private readonly userValidation: IUserValidation,
    private readonly userQuery: IUserQuery,
    private readonly mailService: MailService
  ) {}

  public async register(model: RegisterDto): Promise<IUser> {
    await checkEmptyObject(model);

    const result = await withTransaction(async (session) => {
      // 1. validate domain
      await this.userValidation.validCreateUser(model.email);

      // 2. prepare data
      const password = await encodePassword(model.password);
      const token = createTokenVerifiedUser();

      // TODO: hardcore -> test
      model.group_id = BaseGroup.SYSTEM;

      // 3. create user
      const user = await this.userQuery.createUser(
        {
          ...model,
          password,
          verification_token: token.verification_token,
          verification_token_expires: token.verification_token_expires,
        },
        session
      );

      delete user.password;
      return { user, token };
    });

    const { user, token } = result;
    // 4. send mail (side-effect)
    try {
      await this.mailService.send({
        to: user.email,
        ...MailTemplate.verifyEmail(user.user_name || user.email, token.verification_token),
      });
    } catch (error) {
      // log error
      console.error("Send verify email failed", error);
    }

    return user;
  }

  public async verifyCreateUserToken(verifiedToken: string): Promise<boolean> {
    // 1. validate token
    await this.userValidation.validUserToken(verifiedToken);

    // 2. verify token
    await this.userQuery.verifyUserByToken(verifiedToken);

    return true;
  }

  public async login(model: LoginDto, res: Response): Promise<boolean> {
    const user = await this.userQuery.getUserByEmail(model.email);

    await this.userValidation.validUserLogin(user, model.password);

    // TODO: check group-id

    if (user.token_version === undefined || user.token_version === null) {
      user.token_version = 0;
      await user.save();
    }

    const { accessToken, refreshToken } = this.createTokens(user);

    // ✅ SET COOKIE
    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 60 * 1000, // 30 minutes
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return true;
  }

  public async getLoginUserInfo(userId: string): Promise<IUser> {
    const user = await this.userQuery.getUserById(userId);
    return user;
  }

  private createTokens(user: IUser) {
    const payload = {
      id: user._id,
      role: user.role,
      version: user.token_version,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, { expiresIn: "15m" });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: "7d" });

    return { accessToken, refreshToken };
  }
}
