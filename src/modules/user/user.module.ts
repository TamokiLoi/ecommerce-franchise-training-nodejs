import { IUserQuery, IUserValidation } from "./user.interface";
import { UserQuery } from "./user.query";
import { UserRepository } from "./user.repository";
import { UserValidation } from "./user.validation";

export class UserModule {
  private readonly userRepo: UserRepository;
  private readonly userValidation: UserValidation;
  private readonly userQuery: UserQuery;

  constructor() {
    this.userRepo = new UserRepository();
    this.userValidation = new UserValidation(this.userRepo);
    this.userQuery = new UserQuery(this.userRepo);
  }

  public getUserQuery(): IUserQuery {
    return this.userQuery;
  }

  public getUserValidation(): IUserValidation {
    return this.userValidation;
  }
}
