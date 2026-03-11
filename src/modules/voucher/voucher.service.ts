import { MSG_BUSINESS } from "../../core";
import { BaseFieldName, HttpStatus } from "../../core/enums";
import { HttpException } from "../../core/exceptions";
import { IError } from "../../core/interfaces";
import { BaseCrudService } from "../../core/services";
import { checkEmptyObject, genVoucherCode } from "../../core/utils";
import { AuditAction, AuditEntityType, buildAuditDiff, IAuditLogger, pickAuditSnapshot } from "../audit-log";
import { IProductFranchiseQuery } from "../product-franchise";
import { CreateVoucherDto } from "./dto/create.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import { UpdateVoucherDto } from "./dto/update.dto";
import { VoucherFieldName } from "./voucher.enum";
import { IVoucher, IVoucherQuery } from "./voucher.interface";
import { VoucherRepository } from "./voucher.repository";

const AUDIT_FIELDS_ITEM = [
  VoucherFieldName.CODE,
  BaseFieldName.FRANCHISE_ID,
  VoucherFieldName.PRODUCT_FRANCHISE_ID,
  VoucherFieldName.NAME,
  VoucherFieldName.DESCRIPTION,
  VoucherFieldName.TYPE,
  VoucherFieldName.VALUE,
  VoucherFieldName.QUOTA_TOTAL,
  VoucherFieldName.START_DATE,
  VoucherFieldName.END_DATE,
] as readonly (keyof IVoucher)[];

export class VoucherService
  extends BaseCrudService<IVoucher, CreateVoucherDto, UpdateVoucherDto, SearchPaginationItemDto>
  implements IVoucherQuery
{
  private readonly voucherRepo: VoucherRepository;

  constructor(
    repo: VoucherRepository,
    private readonly auditLogger: IAuditLogger,
    private readonly productFranchiseQuery: IProductFranchiseQuery,
  ) {
    super(repo);
    this.voucherRepo = repo;
  }

  protected async beforeCreate(dto: CreateVoucherDto, loggedUserId: string): Promise<void> {
    await checkEmptyObject(dto);

    const errors: IError[] = [];

    let code = genVoucherCode();

    // 0: check unique
    while (await this.repo.existsByField(VoucherFieldName.CODE, code)) {
      code = genVoucherCode();
    }

    // 1. Validate product franchise
    if (dto.product_franchise_id) {
      const productFranchise = await this.productFranchiseQuery.getById(dto.product_franchise_id);

      if (!productFranchise) {
        errors.push({
          field: BaseFieldName.PRODUCT_FRANCHISE_ID,
          message: "Product franchise not found",
        });
      } else if (productFranchise.franchise_id.toString() !== dto.franchise_id) {
        errors.push({
          field: BaseFieldName.PRODUCT_FRANCHISE_ID,
          message: "Product franchise does not belong to franchise",
        });
      }
    }

    // 2. Validate dates
    if (dto.start_date >= dto.end_date) {
      errors.push({
        field: VoucherFieldName.START_DATE,
        message: "Start date must be before End date",
      });
    }

    if (dto.start_date < new Date()) {
      errors.push({
        field: VoucherFieldName.START_DATE,
        message: "Start date must be in the future",
      });
    }

    // 3. Validate quota
    if (dto.quota_total < 1) {
      errors.push({
        field: VoucherFieldName.QUOTA_TOTAL,
        message: "quota_total must be above 1",
      });
    }

    dto.created_by = loggedUserId;

    if (errors.length) throw new HttpException(HttpStatus.BadRequest, "", errors);

    dto.code = code;
  }

  protected async afterCreate(item: IVoucher, loggedUserId: string): Promise<void> {
    const snapshot = pickAuditSnapshot(item, AUDIT_FIELDS_ITEM);
    await this.auditLogger.log({
      entityType: AuditEntityType.VOUCHER,
      entityId: String(item._id),
      action: AuditAction.CREATE,
      newData: snapshot,
      changedBy: loggedUserId,
    });
  }

  protected async beforeUpdate(current: IVoucher, dto: UpdateVoucherDto, loggedUserId: string): Promise<void> {
    await checkEmptyObject(dto);

    const errors: IError[] = [];

    const start = dto.start_date ?? current.start_date;
    const end = dto.end_date ?? current.end_date;

    // validate date
    if (start >= end) {
      errors.push({
        field: VoucherFieldName.START_DATE,
        message: "start date must be before end date",
      });
    }

    // validate quota
    if (dto.quota_total !== undefined && dto.quota_total < 1) {
      errors.push({
        field: VoucherFieldName.QUOTA_TOTAL,
        message: "quota_total must be >= 1",
      });
    }

    // prevent quota < used
    if (dto.quota_total !== undefined && dto.quota_total < current.quota_used) {
      errors.push({
        field: VoucherFieldName.QUOTA_TOTAL,
        message: "quota_total cannot be less than quota_used",
      });
    }

    if (errors.length) {
      throw new HttpException(HttpStatus.BadRequest, "", errors);
    }
  }

  protected async afterUpdate(oldItem: IVoucher, newItem: IVoucher, loggedUserId: string): Promise<void> {
    const { oldData, newData } = buildAuditDiff(oldItem, newItem, AUDIT_FIELDS_ITEM);

    if (newData && Object.keys(newData).length > 0) {
      await this.auditLogger.log({
        entityType: AuditEntityType.VOUCHER,
        entityId: String(oldItem._id),
        action: AuditAction.UPDATE,
        oldData,
        newData,
        changedBy: loggedUserId,
      });
    }
  }

  protected async afterDelete(item: IVoucher, loggedUserId: string): Promise<void> {
    await this.auditLogger.log({
      entityType: AuditEntityType.VOUCHER,
      entityId: String(item._id),
      action: AuditAction.SOFT_DELETE,
      oldData: { is_deleted: false },
      newData: { is_deleted: true },
      changedBy: loggedUserId,
    });
  }

  protected async afterRestore(item: IVoucher, loggedUserId: string): Promise<void> {
    await this.auditLogger.log({
      entityType: AuditEntityType.VOUCHER,
      entityId: String(item._id),
      action: AuditAction.RESTORE,
      oldData: { is_deleted: true },
      newData: { is_deleted: false },
      changedBy: loggedUserId,
    });
  }

  protected async doSearch(dto: SearchPaginationItemDto): Promise<{ data: IVoucher[]; total: number }> {
    return this.voucherRepo.getItems(dto);
  }

  public async getById(id: string): Promise<IVoucher | null> {
    return this.voucherRepo.getItem(id);
  }

  public async getDetail(id: string): Promise<IVoucher | null> {
    const item = this.voucherRepo.getItem(id);

    if (!item) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.ITEM_NOT_FOUND);
    }

    return item;
  }

  public async changeStatus(id: string, is_active: boolean, loggedUserId: string): Promise<IVoucher | null> {
    const item = await this.voucherRepo.findById(id);

    if (!item) {
      throw new HttpException(HttpStatus.NotFound, "Voucher not found");
    }

    const updated = await this.voucherRepo.update(id, { is_active });

    await this.auditLogger.log({
      entityType: AuditEntityType.VOUCHER,
      entityId: id,
      action: AuditAction.UPDATE,
      oldData: { is_active: item.is_active },
      newData: { is_active },
      changedBy: loggedUserId,
    });

    return updated;
  }

  public async getAllVoucherByFranchiseId(franchiseId: string) {
    return this.voucherRepo.find({
      franchise_id: franchiseId,
      is_deleted: false,
    });
  }

  public async getAllVoucherByProductFranchiseId(productFranchiseId: string) {
    return this.voucherRepo.find({
      product_franchise_id: productFranchiseId,
      is_deleted: false,
    });
  }
}
