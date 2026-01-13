import { ClientSession } from "mongoose";
import { BaseRepository } from "../../core/repository";
import { IUser } from "./user.interface";
import UserSchema from "./user.model";

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(UserSchema);
  }

  async createUser(data: Partial<IUser>, session?: ClientSession): Promise<IUser> {
    console.log("🚀 ~ UserRepository ~ createUser ~ data:", data);
    const result = await this.model.create([data], session ? { session } : {});
    return result[0];
  }

  public async exists(condition: Record<string, any>): Promise<boolean> {
    const result = await this.model.findOne({
      ...condition,
      is_deleted: false,
    });
    return !!result;
  }

  public findByEmail(email: string): Promise<IUser | null> {
    return this.model.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
      is_deleted: false,
    });
  }

  public findToken(token: string): Promise<IUser | null> {
    return this.model.findOne({
      verification_token: token,
      is_deleted: false,
    });
  }

  public async findUserById(userId: string): Promise<IUser | null> {
    return this.model.findOne({ _id: userId, is_deleted: false }).select("-password").lean().exec();
  }
}
