import { ClientSession } from "mongoose";
import { IUser, IUserQuery } from "./user.interface";
import { UserRepository } from "./user.repository";

export class UserQuery implements IUserQuery {
  constructor(private readonly userRepo: UserRepository) {}

  public async createUser(model: Partial<IUser>, session?: ClientSession): Promise<IUser> {
    return this.userRepo.createUser(model, session);
  }

  public async updateUser(userId: string, updateData: Partial<IUser>, session?: ClientSession): Promise<IUser | null> {
    return this.userRepo.findByIdAndUpdate(userId, updateData, { new: true, session });
  }

  public async getUserByToken(token: string): Promise<IUser | null> {
    return this.userRepo.findToken(token);
  }

  public async getUserByEmail(email: string): Promise<IUser | null> {
    return this.userRepo.findByEmail(email);
  }

  public async getUserById(id: string, isFull = false): Promise<IUser | null> {
    return isFull ? this.userRepo.findUserByIdWithPassword(id) : this.userRepo.findUserById(id);
  }

  // user when logout
  public async increaseTokenVersion(userId: string): Promise<IUser | null> {
    return this.userRepo.findByIdAndUpdate(userId, { $inc: { token_version: 1 } }, { new: true });
  }
}
