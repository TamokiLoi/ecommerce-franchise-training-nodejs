import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { HttpStatus } from "../../core/enums";
import { HttpException } from "../../core/exceptions";
import { MailService, MailTemplate } from "../../core/services";
import { checkEmptyObject, encodePassword, withTransaction } from "../../core/utils";
import { createTokenVerifiedUser, generateRandomPassword } from "../../core/utils/helpers";
import { IUser, IUserQuery, IUserValidation } from "../user";
import { AUTH_CONFIG } from "./auth.config";
import { DataStoredInToken } from "./auth.interface";
import { LoginDto, RegisterDto } from "./dto/authCredential.dto";
import { UserContext } from "./dto/authResponse.dto";
import ChangePasswordDto from "./dto/changePassword.dto";

export default class AuthService {
  constructor(
    private readonly userValidation: IUserValidation,
    private readonly userQuery: IUserQuery,
    private readonly mailService: MailService,
  ) {}

  public async register(model: RegisterDto, originDomain?: string | undefined): Promise<IUser> {
    await checkEmptyObject(model);

    const result = await withTransaction(async (session) => {
      // 1. Validate email
      await this.userValidation.validEmailUnique(model.email);

      // 2. Prepare data
      const password = await encodePassword(model.password);
      const token = createTokenVerifiedUser();

      // 3. Create user
      const user = await this.userQuery.createUser(
        {
          ...model,
          password,
          verification_token: token.verification_token,
          verification_token_expires: token.verification_token_expires,
        },
        session,
      );

      delete user.password;
      return { user, token };
    });

    const { user, token } = result;

    // 4. Send mail (side-effect)
    try {
      await this.mailService.send({
        to: user.email,
        ...MailTemplate.verifyEmail(user.name || user.email, token.verification_token, originDomain),
      });
    } catch (error) {
      // log error
      throw new HttpException(HttpStatus.BadRequest, "Failed to send verification email");
    }

    return user;
  }

  public async verifyUserToken(verifiedToken: string): Promise<void> {
    // 1. Validate format token
    await this.userValidation.validUserToken(verifiedToken);

    // 2. Get user
    const user = await this.userQuery.getUserByToken(verifiedToken);

    if (!user) {
      throw new HttpException(HttpStatus.BadRequest, "Token is not valid");
    }

    if (!user.verification_token_expires) {
      throw new HttpException(HttpStatus.BadRequest, "Token expiration is missing");
    }

    if (Date.now() > user.verification_token_expires.getTime()) {
      throw new HttpException(HttpStatus.BadRequest, "Token is expired!");
    }

    // 3. Update user via Query (business meaning)
    const updatedUser = await this.userQuery.updateUser(user._id.toString(), {
      is_verified: true,
      verification_token: undefined,
      verification_token_expires: undefined,
      updated_at: new Date(),
    });

    if (!updatedUser) {
      throw new HttpException(HttpStatus.BadRequest, "Verify user token failed");
    }
  }

  public async resendToken(email: string, originDomain?: string | undefined): Promise<void> {
    // 1. Get user
    const user = await this.userQuery.getUserByEmail(email);
    if (!user || user.is_verified) {
      throw new HttpException(HttpStatus.BadRequest, "Email does not exist or verified");
    }

    // 2. Create verification token
    const token = createTokenVerifiedUser();

    // 3. Update user via Query
    const updatedUser = await this.userQuery.updateUser(user._id.toString(), {
      verification_token: token.verification_token,
      verification_token_expires: token.verification_token_expires,
      updated_at: new Date(),
    });

    if (!updatedUser) {
      throw new HttpException(HttpStatus.BadRequest, "Resend verification token failed");
    }

    // 4. Send mail (side-effect)
    try {
      await this.mailService.send({
        to: user.email,
        ...MailTemplate.verifyEmail(user.name || user.email, token.verification_token, originDomain),
      });
    } catch (error) {
      // log error
      throw new HttpException(HttpStatus.BadRequest, "Failed to send verification email");
    }
  }

  public async login(model: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    return this.validateLogin(model);
  }

  public async logout(userId: string): Promise<void> {
    const user = await this.userQuery.increaseTokenVersion(userId);

    if (!user) {
      throw new HttpException(HttpStatus.BadRequest, "Cannot update user! Logout failed.");
    }
  }

  public async getLoginUserInfo(userId: string): Promise<{ user: IUser; contexts: UserContext[] }> {
    const user = await this.userQuery.getUserById(userId);

    if (!user) {
      throw new HttpException(HttpStatus.BadRequest, "User does not exist");
    }

    // TODO: TEMP: build context từ user.role (phase hiện tại)
    const contexts: UserContext[] = [
      {
        role: user.role,
        scope: user.role === "ADMIN" ? "GLOBAL" : "FRANCHISE",
        franchiseId: null,
      },
    ];

    return {
      user,
      contexts,
    };
  }

  public async forgotPassword(email: string): Promise<void> {
    const COOL_DOWN_MINUTES = 10;

    // 1. Get user
    const user = await this.userQuery.getUserByEmail(email);

    if (!user || user.is_deleted || user.is_active || !user.is_verified) {
      throw new HttpException(HttpStatus.BadRequest, "User does not exist or is not eligible for password reset");
    }

    // Optional: block default admin
    // if (user.email === ADMIN_EMAIL) {
    //   throw new HttpException(HttpStatus.BadRequest, "Cannot reset password for default admin account");
    // }

    // 2. 🔒 COOL_DOWN CHECK
    if (user.last_reset_password_at) {
      const diff = Date.now() - user.last_reset_password_at.getTime();

      if (diff < COOL_DOWN_MINUTES * 60 * 1000) {
        throw new HttpException(
          HttpStatus.TooManyRequests,
          `Please wait ${COOL_DOWN_MINUTES} minutes before requesting another password reset`,
        );
      }
    }

    // 3. Generate new password
    const generateNewPassword = generateRandomPassword(10);
    const newPassword = await encodePassword(generateNewPassword);

    // 4. Update user via Query
    const updatedUser = await this.userQuery.updateUser(user._id.toString(), {
      password: newPassword,
      last_reset_password_at: new Date(),
      updated_at: new Date(),
    });

    if (!updatedUser) {
      throw new HttpException(HttpStatus.BadRequest, "Failed to reset password");
    }

    // 5. Send new password email (side-effect)
    try {
      await this.mailService.send({
        to: user.email,
        ...MailTemplate.resetPassword(user.name || user.email, generateNewPassword),
      });
    } catch (error) {
      // log error here if needed
      throw new HttpException(HttpStatus.BadRequest, "Failed to send reset password email");
    }
  }

  public async changePassword(model: ChangePasswordDto, loggedUser: DataStoredInToken): Promise<void> {
    await checkEmptyObject(model);

    const userId = loggedUser.id;

    // 1. Get user
    const user = await this.userQuery.getUserById(userId, true);

    if (!user) {
      throw new HttpException(HttpStatus.BadRequest, "User does not exist");
    }

    // Optional: block default admin
    // if (user.email === ADMIN_EMAIL) {
    //   throw new HttpException(HttpStatus.BadRequest, "Cannot change password for admin account default.");
    // }

    // 2. Check old_password match
    const isMatchPassword = await bcryptjs.compare(model.old_password, user.password!);
    if (!isMatchPassword) {
      throw new HttpException(HttpStatus.Unauthorized, `Your old password is not valid!`);
    }

    // 3. Compare new_password vs old_password
    if (model.new_password === model.old_password) {
      throw new HttpException(HttpStatus.BadRequest, `New password must be different from old password`);
    }

    // 4. Update new password
    const newPassword = await encodePassword(model.new_password);
    const updatedUser = await this.userQuery.updateUser(userId, {
      password: newPassword,
      updated_at: new Date(),
    });

    if (!updatedUser) throw new HttpException(HttpStatus.BadRequest, "Change password failed!");
  }

  // ===== PRIVATE HELPERS =====

  private async validateLogin(model: LoginDto) {
    const user = await this.userQuery.getUserByEmail(model.email);

    if (!user) {
      throw new HttpException(HttpStatus.BadRequest, "Email does not exist");
    }

    await this.userValidation.validUserLogin(user, model.password);

    if (user.token_version === undefined || user.token_version === null) {
      user.token_version = 0;
      await user.save();
    }

    return this.createTokens(user);
  }

  private createTokens(user: IUser) {
    const payload = {
      id: user._id,
      role: user.role,
      version: user.token_version,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
      expiresIn: AUTH_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN,
    });

    return { accessToken, refreshToken };
  }
}
