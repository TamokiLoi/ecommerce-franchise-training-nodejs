import { BaseModule } from "../../core/modules";
import { MailService } from "../../core/services";
import UserController from "./user.controller";
import { IUserQuery, IUserValidation } from "./user.interface";
import { UserQuery } from "./user.query";
import { UserRepository } from "./user.repository";
import UserRoute from "./user.route";
import UserService from "./user.service";
import { UserValidation } from "./user.validation";

export class UserModule extends BaseModule<UserRoute> {
  private readonly userRepo: UserRepository;
  private readonly userValidation: UserValidation;
  private readonly userQuery: UserQuery;

  constructor() {
    super();
    this.userRepo = new UserRepository();
    this.userValidation = new UserValidation(this.userRepo);
    this.userQuery = new UserQuery(this.userRepo);

    const mailService = new MailService();
    const userService = new UserService(this.getUserValidation(), this.getUserQuery(), mailService);
    const userController = new UserController(userService);
    this.route = new UserRoute(userController);
  }

  public getUserQuery(): IUserQuery {
    return this.userQuery;
  }

  public getUserValidation(): IUserValidation {
    return this.userValidation;
  }
}
