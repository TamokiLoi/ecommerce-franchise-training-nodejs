import {
  BaseCrudService,
  BaseFieldName,
  checkEmptyObject,
  encodePassword,
  HttpException,
  HttpStatus,
  IError,
  MailService,
  MailTemplate,
  MSG_BUSINESS,
  normalizeText,
  UpdateStatusDto,
  withTransaction,
} from "../../core";
import { createTokenVerified } from "../../core/utils/helpers";
import { AuditAction, AuditEntityType, buildAuditDiff, IAuditLogger, pickAuditSnapshot } from "../audit-log";
import { ICustomer, ICustomerQuery } from "./customer.interface";
import { CustomerRepository } from "./customer.repository";
import CreateCustomerDto from "./dto/create.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import UpdateCustomerDto from "./dto/update.dto";

export const AUDIT_FIELDS_ITEM = [
  BaseFieldName.EMAIL,
  BaseFieldName.NAME,
  BaseFieldName.PHONE,
  BaseFieldName.AVATAR_URL,
] as readonly (keyof ICustomer)[];

export default class CustomerService
  extends BaseCrudService<ICustomer, CreateCustomerDto, UpdateCustomerDto, SearchPaginationItemDto>
  implements ICustomerQuery
{
  private readonly customerRepo: CustomerRepository;

  constructor(
    repo: CustomerRepository,
    private readonly auditLogger: IAuditLogger,
    private readonly mailService: MailService,
  ) {
    super(repo);
    this.customerRepo = repo;
  }

  // ===== Start CRUD =====

  // Override createItem to handle for api register or create by user account
  public async createItem(
    payload: CreateCustomerDto,
    loggedUserId?: string,
    originDomain?: string | undefined,
  ): Promise<ICustomer> {
    await checkEmptyObject(payload);

    const result = await withTransaction(async (session) => {
      const errors: IError[] = [];

      // 1. Normalize
      const normalizedName = normalizeText(payload.name);
      const normalizedPhone = normalizeText(payload.phone);

      // 2. Check unique email
      if (await this.repo.existsByField(BaseFieldName.EMAIL, payload.email)) {
        errors.push({
          field: BaseFieldName.EMAIL,
          message: MSG_BUSINESS.ITEM_EXISTS(`Customer with Email: '${payload.email}'`),
        });
      }

      // 3. Check unique phone
      if (payload.phone && (await this.repo.existsByField(BaseFieldName.PHONE, normalizedPhone))) {
        errors.push({
          field: BaseFieldName.PHONE,
          message: MSG_BUSINESS.ITEM_EXISTS(`Customer with Phone: '${payload.phone}'`),
        });
      }

      if (errors.length) {
        throw new HttpException(HttpStatus.BadRequest, "", errors);
      }

      // 4. Prepare data
      const password = await encodePassword(payload.password);
      const token = createTokenVerified();

      // 5. Create item
      const newItem = await this.repo.create(
        {
          ...payload,
          name: normalizedName,
          phone: normalizedPhone,
          password,
          verification_token: token.verification_token,
          verification_token_expires: token.verification_token_expires,
        },
        session,
      );

      delete newItem.password;
      return { newItem, token };
    });

    const { newItem, token } = result;

    // 6. Send mail (side-effect)
    try {
      await this.mailService.send({
        to: newItem.email,
        ...MailTemplate.verifyEmail(newItem.name || newItem.email, token.verification_token, originDomain, true),
      });
    } catch (error) {
      // log error
      throw new HttpException(HttpStatus.InternalServerError, "Failed to send verification email");
    }

    // 7. Audit log
    const snapshot = pickAuditSnapshot(newItem, AUDIT_FIELDS_ITEM);

    await this.auditLogger.log({
      entityType: AuditEntityType.CUSTOMER,
      entityId: String(newItem._id),
      action: AuditAction.CREATE,
      newData: snapshot,
      changedBy: loggedUserId || "register",
    });

    return newItem;
  }

  protected async beforeUpdate(current: ICustomer, payload: UpdateCustomerDto, _loggedUserId: string): Promise<void> {
    await checkEmptyObject(payload);

    const errors: IError[] = [];

    // 1. Validate email if changed
    if (payload.email !== current.email) {
      if (await this.repo.existsByField(BaseFieldName.EMAIL, payload.email, { excludeId: current._id.toString() })) {
        errors.push({
          field: BaseFieldName.EMAIL,
          message: MSG_BUSINESS.ITEM_EXISTS(`Customer with Email: '${payload.email}'`),
        });
      }
    }

    // 2. Validate phone if changed
    if (payload.phone && payload.phone !== current.phone) {
      const normalizedPhone = normalizeText(payload.phone);
      if (await this.repo.existsByField(BaseFieldName.PHONE, normalizedPhone, { excludeId: current._id.toString() })) {
        errors.push({
          field: BaseFieldName.PHONE,
          message: MSG_BUSINESS.ITEM_EXISTS(`Customer with Phone: '${payload.phone}'`),
        });
      }
    }

    if (errors.length) {
      throw new HttpException(HttpStatus.BadRequest, "", errors);
    }

    // 3. Check if there's any change
    const hasChange = (Object.keys(payload) as (keyof UpdateCustomerDto)[]).some(
      (key) => payload[key] !== current[key],
    );

    if (!hasChange) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.NO_DATA_TO_UPDATE);
    }
  }

  protected async afterUpdate(oldItem: ICustomer, newItem: ICustomer, loggedUserId: string): Promise<void> {
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

  protected async afterDelete(item: ICustomer, loggedUserId: string): Promise<void> {
    await this.auditLogger.log({
      entityType: AuditEntityType.CUSTOMER,
      entityId: String(item._id),
      action: AuditAction.SOFT_DELETE,
      oldData: { is_deleted: false },
      newData: { is_deleted: true },
      changedBy: loggedUserId,
    });
  }

  protected async afterRestore(item: ICustomer, loggedUserId: string): Promise<void> {
    await this.auditLogger.log({
      entityType: AuditEntityType.CUSTOMER,
      entityId: String(item._id),
      action: AuditAction.RESTORE,
      oldData: { is_deleted: true },
      newData: { is_deleted: false },
      changedBy: loggedUserId,
    });
  }

  protected async doSearch(dto: SearchPaginationItemDto): Promise<{ data: ICustomer[]; total: number }> {
    return this.customerRepo.getItems(dto);
  }
  // ===== END CRUD =====

  // Additional business logic
  public async changeStatus(id: string, model: UpdateStatusDto, loggedUserId: string): Promise<void> {
    const { is_active } = model;

    // 1. Get item
    const currentItem = await this.repo.findById(id);
    if (!currentItem) {
      throw new HttpException(HttpStatus.NotFound, MSG_BUSINESS.ITEM_NOT_FOUND);
    }

    // 2. Check change status
    if (currentItem.is_active === is_active) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.STATUS_NO_CHANGE);
    }

    // 3. Update status
    await this.repo.update(id, { is_active });

    // 4. Audit log
    await this.auditLogger.log({
      entityType: AuditEntityType.CUSTOMER,
      entityId: id,
      action: AuditAction.CHANGE_STATUS,
      oldData: { is_active: currentItem.is_active },
      newData: { is_active },
      changedBy: loggedUserId,
    });
  }

  // Implement ICustomerQuery
  public async getById(id: string, isPassword: boolean = false): Promise<ICustomer | null> {
    return isPassword ? this.customerRepo.findById(id) : this.customerRepo.findByIdNoPassword(id);
  }

  public async getByEmail(email: string): Promise<ICustomer | null> {
    return this.customerRepo.findByEmail(email);
  }

  public async getByToken(token: string): Promise<ICustomer | null> {
    return this.customerRepo.findByToken(token);
  }

  public async updateCustomerTokenVersion(id: string): Promise<ICustomer | null> {
    return this.customerRepo.updateCustomerTokenVersion(id);
  }

  public async updateCustomerResendToken(id: string): Promise<ICustomer | null> {
    const token = createTokenVerified();
    return this.customerRepo.updateCustomerResendToken(id, token.verification_token, token.verification_token_expires);
  }

  public async updateCustomerPassword(
    id: string,
    newPassword: string,
    isForgotPassword: boolean,
  ): Promise<ICustomer | null> {
    return this.customerRepo.updateCustomerPassword(id, newPassword, isForgotPassword);
  }

  public async increaseTokenVersion(id: string): Promise<ICustomer | null> {
    return this.customerRepo.increaseTokenVersion(id);
  }

  public async searchByKeyword(keyword: string): Promise<ICustomer[]> {
    return this.customerRepo.searchByKeyword(keyword);
  }
}
