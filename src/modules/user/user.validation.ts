import bcryptjs from "bcryptjs";
import { HttpStatus } from "../../core/enums";
import { HttpException } from "../../core/exceptions";
import { IUser, IUserValidation } from "./user.interface";
import { UserRepository } from "./user.repository";

export class UserValidation implements IUserValidation {
  constructor(private readonly userRepo: UserRepository) {}

  public async validEmailUnique(email: string, excludeUserId?: string): Promise<void> {
    const condition: any = { email, is_deleted: false };

    if (excludeUserId) {
      condition._id = { $ne: excludeUserId };
    }

    const exists = await this.userRepo.exists(condition);

    if (exists) {
      throw new HttpException(HttpStatus.BadRequest, `Your email '${email}' already exists`);
    }
  }

  public async validUserToken(token: string): Promise<void> {
    await this.checkExists(this.tokenExistsCondition(token), "Token is not valid");
  }

  public async validUserLogin(user: IUser, password: string): Promise<void> {
    // check email verified
    if (!user.is_verified) {
      throw new HttpException(HttpStatus.BadRequest, "User is not verified! Please check your email in 24h!");
    }

    // check password match
    const isMatchPassword = await bcryptjs.compare(password, user.password!);
    if (!isMatchPassword) {
      throw new HttpException(HttpStatus.BadRequest, "Password incorrect");
    }

    // check status user
    if (user.is_active || user.is_deleted) {
      const reason = user.is_active
        ? "locked. Please contact admin via mail to activate!"
        : "deleted. Please contact admin via mail for assistance!";
      throw new HttpException(HttpStatus.Forbidden, `Your account has been ${reason}`);
    }
  }

  // check email duplicates
  private emailExistsCondition(email: string): Record<string, any> {
    return {
      email: { $regex: new RegExp(`^${email}$`, "i") },
    };
  }

  // check token exists
  private tokenExistsCondition(token: string): Record<string, any> {
    return { verification_token: token };
  }

  private async checkExists(condition: Record<string, any>, errorMessage: string): Promise<void> {
    const exists = await this.userRepo.exists(condition);
    if (!exists) {
      throw new HttpException(HttpStatus.BadRequest, errorMessage);
    }
  }
}
