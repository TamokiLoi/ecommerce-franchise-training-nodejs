import { BaseRole, HttpStatus } from "../../core/enums";
import { HttpException } from "../../core/exceptions";
import { IError } from "../../core/interfaces";
import { MailService, MailTemplate } from "../../core/services";
import { checkEmptyObject, encodePassword, withTransaction } from "../../core/utils";
import { createTokenVerifiedUser } from "../../core/utils/helpers";
import { DataStoredInToken } from "../auth/auth.interface";
import ChangeRoleDto from "./dto/changeRole.dto";
import ChangeStatusDto from "./dto/changeStatus.dto";
import CreateUserDto from "./dto/create.dto";
import UpdateUserDto from "./dto/update.dto";
import { IUser, IUserQuery, IUserValidation } from "./user.interface";

export default class UserService {
  constructor(
    private readonly userValidation: IUserValidation,
    private readonly userQuery: IUserQuery,
    private readonly mailService: MailService,
  ) {}

  public async createUser(model: CreateUserDto, originDomain?: string | undefined): Promise<IUser> {
    await checkEmptyObject(model);

    const result = await withTransaction(async (session) => {
      // 1. Validate email
      await this.userValidation.validEmailUnique(model.email);

      // 2. Prepare data
      const password = await encodePassword(model.password);
      const token = createTokenVerifiedUser();

      const role: BaseRole = (model.role as BaseRole) || BaseRole.USER;

      // 3. Create user
      const user = await this.userQuery.createUser(
        {
          ...model,
          password,
          role,
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
      throw new HttpException(HttpStatus.InternalServerError, "Failed to send verification email");
    }

    return user;
  }

  public async getUserById(id: string): Promise<IUser> {
    const user = await this.userQuery.getUserById(id);
    if (!user) {
      throw new HttpException(HttpStatus.BadRequest, "User does not exist");
    }
    return user;
  }

  public async changeStatus(model: ChangeStatusDto): Promise<void> {
    await checkEmptyObject(model);

    // 1. Get user
    const user = await this.getUserById(model.user_id);
    if (!user) {
      throw new HttpException(HttpStatus.BadRequest, "User does not exist");
    }

    // 2. Check change status
    if (user.is_active === model.status) {
      throw new HttpException(HttpStatus.BadRequest, `User status is same as before`);
    }

    // 3. Update user via Query
    const updatedUser = await this.userQuery.updateUser(user._id.toString(), {
      is_active: model.status,
      updated_at: new Date(),
    });

    if (!updatedUser) {
      throw new HttpException(HttpStatus.BadRequest, "Update user status failed!");
    }
  }

  public async changeRole(model: ChangeRoleDto, loggedUser: DataStoredInToken): Promise<void> {
    await checkEmptyObject(model);

    // 1. Get user
    const user = await this.getUserById(model.user_id);
    if (!user) {
      throw new HttpException(HttpStatus.BadRequest, "User does not exist");
    }

    // 2. Check change role
    if (user.role === model.role) {
      throw new HttpException(HttpStatus.BadRequest, `User role is already: ${model.role}`);
    }

    // 3. Check role User logged in
    if (loggedUser.role === BaseRole.MANAGER && (model.role === BaseRole.ADMIN || model.role === BaseRole.MANAGER)) {
      throw new HttpException(
        HttpStatus.BadRequest,
        "Cannot change role other user to Admin or Manager, please contact Admin!",
      );
    }

    // 3. Update user via Query
    const updatedUser = await this.userQuery.updateUser(user._id.toString(), {
      role: model.role,
      updated_at: new Date(),
    });

    if (!updatedUser) {
      throw new HttpException(HttpStatus.BadRequest, "Update user role failed!");
    }
  }

  public async updateUser(userId: string, model: UpdateUserDto, loggedUser: DataStoredInToken): Promise<IUser> {
    await checkEmptyObject(model);

    // 1. Get user
    const user = await this.getUserById(userId);
    if (!user) {
      throw new HttpException(HttpStatus.BadRequest, "User does not exist");
    }

    // 2. Check role user
    if (loggedUser.role !== BaseRole.ADMIN && loggedUser.role !== BaseRole.MANAGER && loggedUser.id !== userId) {
      throw new HttpException(HttpStatus.BadRequest, "You don't have permission to update this user!");
    }

    // 3 Check email duplicate (exclude current user)
    if (model.email && model.email !== user.email) {
      await this.userValidation.validEmailUnique(model.email, user._id.toString());
    }

    // 4. Update user via Query
    const updatedUser = await this.userQuery.updateUser(user._id.toString(), {
      ...model,
      updated_at: new Date(),
    });

    if (!updatedUser) {
      throw new HttpException(HttpStatus.BadRequest, "Update user info failed!");
    }

    return this.getUserById(userId);
  }
}
