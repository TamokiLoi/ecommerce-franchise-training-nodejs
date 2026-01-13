import { ClientSession } from "mongoose";
import { HttpStatus } from "../../core/enums";
import { HttpException } from "../../core/exceptions";
import { IUser, IUserQuery } from "./user.interface";
import { UserRepository } from "./user.repository";
import { mapUserToResponse } from "./user.mapper";
import { UserResponseDto } from "./dto/userResponse.dto";

export class UserQuery implements IUserQuery {
  constructor(private readonly userRepo: UserRepository) {}

  public async createUser(model: Partial<IUser>, session?: ClientSession): Promise<IUser> {
    return this.userRepo.createUser(model, session);
  }

  public async verifyUserByToken(token: string): Promise<void> {
    const user = await this.getUserByToken(token);

    if (!user.verification_token_expires) {
      throw new HttpException(HttpStatus.BadRequest, "Token expiration is missing");
    }

    if (Date.now() > user.verification_token_expires.getTime()) {
      throw new HttpException(HttpStatus.BadRequest, "Token is expired!");
    }

    user.is_verified = true;
    user.verification_token = undefined;
    user.verification_token_expires = undefined;
    user.updated_at = new Date();

    await user.save();
  }

  public async getUserByToken(token: string): Promise<IUser> {
    const user = await this.userRepo.findToken(token);

    if (!user) {
      throw new HttpException(HttpStatus.BadRequest, "Token is not valid");
    }

    return user;
  }

  public async getUserById(id: string): Promise<IUser> {
    const user = await this.userRepo.findUserById(id);

    if (!user) {
      throw new HttpException(HttpStatus.BadRequest, "User does not exist");
    }

    return user;
  }

  // TODO: check group-id
  public async getUserByEmail(email: string): Promise<IUser> {
    const user = await this.userRepo.findByEmail(email);

    if (!user) {
      throw new HttpException(HttpStatus.BadRequest, "Email does not exist");
    }

    return user;
  }
}
