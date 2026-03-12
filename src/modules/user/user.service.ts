import { ObjectId } from "mongodb";
import { ACCOUNT_DEFAULT, IError, MSG_BUSINESS, UpdateStatusDto } from "../../core";
import { BaseFieldName, HttpStatus } from "../../core/enums";
import { HttpException } from "../../core/exceptions";
import { BaseCrudService, MailService, MailTemplate } from "../../core/services";
import { checkEmptyObject, encodePassword, normalizeText, withTransaction } from "../../core/utils";
import { createTokenVerified } from "../../core/utils/helpers";
import { AuditAction, AuditEntityType, buildAuditDiff, IAuditLogger, pickAuditSnapshot } from "../audit-log";
import CreateUserDto from "./dto/create.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import UpdateUserDto from "./dto/update.dto";
import { IUser, IUserQuery, IUserValidation } from "./user.interface";
import { UserRepository } from "./user.repository";

export const AUDIT_FIELDS_ITEM = [
  BaseFieldName.EMAIL,
  BaseFieldName.NAME,
  BaseFieldName.PHONE,
  BaseFieldName.AVATAR_URL,
] as readonly (keyof IUser)[];

export default class UserService extends BaseCrudService<IUser, CreateUserDto, UpdateUserDto, SearchPaginationItemDto> {
  private readonly userRepo: UserRepository;

  constructor(
    repo: UserRepository,
    private readonly auditLogger: IAuditLogger,
    private readonly userValidation: IUserValidation,
    private readonly userQuery: IUserQuery,
    private readonly mailService: MailService,
  ) {
    super(repo);
    this.userRepo = repo;
  }

  // ===== Start CRUD =====
  // Override createItem to include user ID and Origin header
  public async createItem(
    model: CreateUserDto,
    loggedUserId: string,
    originDomain?: string | undefined,
  ): Promise<IUser> {
    await checkEmptyObject(model);

    const result = await withTransaction(async (session) => {
      const errors: IError[] = [];

      // 1. Normalize
      const normalizedName = normalizeText(model.name);

      // 2. Validate email
      if (await this.repo.existsByField(BaseFieldName.EMAIL, model.email)) {
        errors.push({
          field: BaseFieldName.EMAIL,
          message: MSG_BUSINESS.ITEM_EXISTS(`User with Email: '${model.email}'`),
        });
      }

      if (errors.length) {
        throw new HttpException(HttpStatus.BadRequest, "", errors);
      }

      // 3. Prepare data
      const password = await encodePassword(model.password);
      const token = createTokenVerified();

      // 4. Create user
      const user = await this.userQuery.createUser(
        {
          ...model,
          name: normalizedName,
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
      throw new HttpException(HttpStatus.InternalServerError, "Failed to send verification email");
    }

    // 5. Audit log
    const snapshot = pickAuditSnapshot(user, AUDIT_FIELDS_ITEM);

    await this.auditLogger.log({
      entityType: AuditEntityType.USER,
      entityId: String(user._id),
      action: AuditAction.CREATE,
      newData: snapshot,
      changedBy: loggedUserId,
    });

    return user;
  }

  protected async beforeUpdate(current: IUser, dto: UpdateUserDto, _loggedUserId: string): Promise<void> {
    await checkEmptyObject(dto);

    const errors: IError[] = [];

    // 1. Validate email if changed
    if (dto.email !== current.email) {
      if (await this.repo.existsByField(BaseFieldName.EMAIL, dto.email, { excludeId: current._id.toString() })) {
        errors.push({
          field: BaseFieldName.EMAIL,
          message: MSG_BUSINESS.ITEM_EXISTS(`User with Email: '${dto.email}'`),
        });
      }
    }

    if (errors.length) {
      throw new HttpException(HttpStatus.BadRequest, "", errors);
    }

    // 2. Check if there's any change
    const hasChange = (Object.keys(dto) as (keyof UpdateUserDto)[]).some((key) => dto[key] !== current[key]);

    if (!hasChange) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.NO_DATA_TO_UPDATE);
    }
  }

  protected async afterUpdate(oldItem: IUser, newItem: IUser, loggedUserId: string): Promise<void> {
    const { oldData, newData } = buildAuditDiff(oldItem, newItem, AUDIT_FIELDS_ITEM);

    if (newData && Object.keys(newData).length > 0) {
      await this.auditLogger.log({
        entityType: AuditEntityType.USER,
        entityId: String(oldItem._id),
        action: AuditAction.UPDATE,
        oldData,
        newData,
        changedBy: loggedUserId,
      });
    }
  }

  protected async beforeDelete(item: IUser, loggedUserId: string): Promise<void> {
    // Prevent user from removing own account default
    if (item._id.equals(new ObjectId(loggedUserId))) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.CANNOT_REMOVE_OWN_ACCOUNT);
    }

    // Prevent user from removing default account
    if (ACCOUNT_DEFAULT.includes(item.email)) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.CANNOT_REMOVE_DEFAULT_ACCOUNT);
    }
  }

  protected async afterDelete(item: IUser, loggedUserId: string): Promise<void> {
    await this.auditLogger.log({
      entityType: AuditEntityType.USER,
      entityId: String(item._id),
      action: AuditAction.SOFT_DELETE,
      oldData: { is_deleted: false },
      newData: { is_deleted: true },
      changedBy: loggedUserId,
    });
  }

  protected async afterRestore(item: IUser, loggedUserId: string): Promise<void> {
    await this.auditLogger.log({
      entityType: AuditEntityType.USER,
      entityId: String(item._id),
      action: AuditAction.RESTORE,
      oldData: { is_deleted: true },
      newData: { is_deleted: false },
      changedBy: loggedUserId,
    });
  }

  protected async doSearch(dto: SearchPaginationItemDto): Promise<{ data: IUser[]; total: number }> {
    return this.userRepo.getItems(dto);
  }
  // ===== END CRUD =====

  public async getUserById(id: string): Promise<IUser> {
    const user = await this.userQuery.getUserById(id);
    if (!user) {
      throw new HttpException(HttpStatus.BadRequest, "User does not exist");
    }
    return user;
  }

  public async changeStatus(id: string, model: UpdateStatusDto, loggedUserId: string): Promise<void> {
    const { is_active } = model;

    // 1. Get user
    const currentItem = await this.repo.findById(id);
    if (!currentItem) {
      throw new HttpException(HttpStatus.NotFound, MSG_BUSINESS.ITEM_NOT_FOUND);
    }

    // 2. Prevent user from changing own status
    if (currentItem._id.equals(new ObjectId(loggedUserId))) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.CANNOT_CHANGE_OWN_STATUS);
    }

    // 3. Prevent changing status of default account
    if (ACCOUNT_DEFAULT.includes(currentItem.email)) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.CANNOT_CHANGE_DEFAULT_ACCOUNT_STATUS);
    }

    // 4. Check change status
    if (currentItem.is_active === is_active) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.STATUS_NO_CHANGE);
    }

    // 5. Update status
    await this.repo.update(id, { is_active });

    // 6. Audit log
    await this.auditLogger.log({
      entityType: AuditEntityType.USER,
      entityId: id,
      action: AuditAction.CHANGE_STATUS,
      oldData: { is_active: currentItem.is_active },
      newData: { is_active },
      changedBy: loggedUserId,
    });
  }

  public async searchByKeyword(keyword: string): Promise<IUser[]> {
    return this.userRepo.searchByKeyword(keyword);
  }
}
