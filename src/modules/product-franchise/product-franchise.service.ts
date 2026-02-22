import { MSG_BUSINESS } from "../../core/constants";
import { UpdateStatusDto } from "../../core/dto";
import { BaseFieldName, HttpStatus } from "../../core/enums";
import { HttpException } from "../../core/exceptions";
import { IError } from "../../core/interfaces";
import { BaseCrudService } from "../../core/services";
import { checkEmptyObject } from "../../core/utils";
import { AuditAction, AuditEntityType, buildAuditDiff, IAuditLogger, pickAuditSnapshot } from "../audit-log";
import { IFranchiseQuery } from "../franchise";
import { IProductQuery } from "../product";
import { CreateProductFranchiseDto } from "./dto/create.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import { UpdateProductFranchiseDto } from "./dto/update.dto";
import { IProductFranchise, IProductFranchiseQuery } from "./product-franchise.interface";
import { ProductFranchiseRepository } from "./product-franchise.repository";

const AUDIT_FIELDS_ITEM = [
  BaseFieldName.PRODUCT_ID,
  BaseFieldName.FRANCHISE_ID,
  BaseFieldName.SIZE,
  BaseFieldName.PRICE_BASE,
] as readonly (keyof IProductFranchise)[];

export class ProductFranchiseService
  extends BaseCrudService<
    IProductFranchise,
    CreateProductFranchiseDto,
    UpdateProductFranchiseDto,
    SearchPaginationItemDto
  >
  implements IProductFranchiseQuery
{
  private readonly productFranchiseRepo: ProductFranchiseRepository;

  constructor(
    repo: ProductFranchiseRepository,
    private readonly auditLogger: IAuditLogger,
    private readonly productQuery: IProductQuery,
    private readonly franchiseQuery: IFranchiseQuery,
  ) {
    super(repo);
    this.productFranchiseRepo = repo;
  }

  // ===== Start CRUD =====
  protected async beforeCreate(dto: CreateProductFranchiseDto, loggedUserId: string): Promise<void> {
    await checkEmptyObject(dto);

    // 0. Normalize size
    dto.size = this.normalizeSize(dto.size);

    const { product_id, franchise_id, size, price_base } = dto;

    const errors: IError[] = [];

    // 1. Validate franchise exists
    const franchise = await this.franchiseQuery.getById(franchise_id);
    if (!franchise) {
      errors.push({
        field: BaseFieldName.FRANCHISE_ID,
        message: MSG_BUSINESS.ITEM_NOT_FOUND_WITH_NAME("Franchise"),
      });
    }

    // 2. Validate product exists
    const product = await this.productQuery.getById(product_id);
    if (!product) {
      errors.push({
        field: BaseFieldName.PRODUCT_ID,
        message: MSG_BUSINESS.ITEM_NOT_FOUND_WITH_NAME("Product"),
      });
    }

    // 3. Validate price range based on product
    if (product) {
      this.validatePriceBaseWithProduct(price_base, product, errors);
    }

    // 4. Prevent duplicate (product + franchise + size)
    const existed = await this.productFranchiseRepo.findByProductFranchiseAndSize(product_id, franchise_id, size);
    if (existed) {
      errors.push({
        field: BaseFieldName.PRODUCT_ID,
        message: MSG_BUSINESS.ITEM_EXISTS(`This product [${product?.name}] with size [${size}] in franchise`),
      });
    }

    // 5. Validate price
    if (price_base < 0) {
      errors.push({
        field: BaseFieldName.PRICE_BASE,
        message: "Price must be >= 0",
      });
    }

    if (errors.length) {
      throw new HttpException(HttpStatus.BadRequest, "", errors);
    }
  }

  protected async afterCreate(item: IProductFranchise, loggedUserId: string): Promise<void> {
    const snapshot = pickAuditSnapshot(item, AUDIT_FIELDS_ITEM);

    await this.auditLogger.log({
      entityType: AuditEntityType.PRODUCT_FRANCHISE,
      entityId: String(item._id),
      action: AuditAction.CREATE,
      newData: snapshot,
      changedBy: loggedUserId,
    });
  }

  protected async beforeUpdate(
    current: IProductFranchise,
    dto: UpdateProductFranchiseDto,
    loggedUserId: string,
  ): Promise<void> {
    await checkEmptyObject(dto);

    const { size, price_base } = dto;

    const errors: IError[] = [];

    // 1. Determine price need use (partial update safe)
    const nextPrice = price_base ?? current.price_base;

    // 2. If not update price → do not validate price
    if (price_base !== undefined) {
      // 2.1 Price >= 0
      if (nextPrice < 0) {
        errors.push({
          field: BaseFieldName.PRICE_BASE,
          message: "Price must be >= 0",
        });
      } else {
        // 2.2 Get product to check range
        const product = await this.productQuery.getById(String(current.product_id));
        if (!product) {
          errors.push({
            field: BaseFieldName.PRODUCT_ID,
            message: MSG_BUSINESS.ITEM_NOT_FOUND_WITH_NAME("Product"),
          });
        } else {
          // 2.3 Check price ∈ [min_price, max_price]
          this.validatePriceBaseWithProduct(nextPrice, product, errors);
        }
      }
    }

    // 3. If size updated → prevent duplicate (product + franchise + size)
    if (size !== undefined) {
      const normalizedSize = this.normalizeSize(size);
      const currentNormalizedSize = this.normalizeSize(String(current.size));

      // 3.1 Validate size format
      if (normalizedSize !== currentNormalizedSize) {
        const existed = await this.productFranchiseRepo.findByProductFranchiseAndSize(
          String(current.product_id),
          String(current.franchise_id),
          normalizedSize ?? null,
          { excludeId: String(current._id) },
        );

        if (existed) {
          errors.push({
            field: BaseFieldName.SIZE,
            message: MSG_BUSINESS.ITEM_EXISTS(`Product with size ${normalizedSize} in franchise`),
          });
        }
      }
    }

    if (errors.length) {
      throw new HttpException(HttpStatus.BadRequest, "", errors);
    }
  }

  protected async afterUpdate(
    oldItem: IProductFranchise,
    newItem: IProductFranchise,
    loggedUserId: string,
  ): Promise<void> {
    const { oldData, newData } = buildAuditDiff(oldItem, newItem, AUDIT_FIELDS_ITEM);

    if (newData && Object.keys(newData).length > 0) {
      await this.auditLogger.log({
        entityType: AuditEntityType.PRODUCT_FRANCHISE,
        entityId: String(oldItem._id),
        action: AuditAction.UPDATE,
        oldData,
        newData,
        changedBy: loggedUserId,
      });
    }
  }

  protected async afterDelete(item: IProductFranchise, loggedUserId: string): Promise<void> {
    await this.auditLogger.log({
      entityType: AuditEntityType.PRODUCT_FRANCHISE,
      entityId: String(item._id),
      action: AuditAction.SOFT_DELETE,
      oldData: { is_deleted: false },
      newData: { is_deleted: true },
      changedBy: loggedUserId,
    });
  }

  protected async afterRestore(item: IProductFranchise, loggedUserId: string): Promise<void> {
    await this.auditLogger.log({
      entityType: AuditEntityType.PRODUCT_FRANCHISE,
      entityId: String(item._id),
      action: AuditAction.RESTORE,
      oldData: { is_deleted: true },
      newData: { is_deleted: false },
      changedBy: loggedUserId,
    });
  }

  protected async doSearch(dto: SearchPaginationItemDto): Promise<{ data: IProductFranchise[]; total: number }> {
    return this.productFranchiseRepo.getItems(dto);
  }
  // ===== End CRUD =====

  /**
   * Update active status
   */
  public async changeStatus(id: string, dto: UpdateStatusDto, loggedUserId: string): Promise<void> {
    const { is_active } = dto;

    const currentItem = await this.repo.findById(id);
    if (!currentItem) {
      throw new HttpException(HttpStatus.NotFound, MSG_BUSINESS.ITEM_NOT_FOUND);
    }

    if (currentItem.is_active === is_active) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.STATUS_NO_CHANGE);
    }

    // 1. Update status
    await this.repo.update(id, { is_active });

    // 2. Audit log
    await this.auditLogger.log({
      entityType: AuditEntityType.PRODUCT_FRANCHISE,
      entityId: id,
      action: AuditAction.CHANGE_STATUS,
      oldData: { is_active: currentItem.is_active },
      newData: { is_active },
      changedBy: loggedUserId,
    });
  }

  // Support for IProductFranchiseQuery
  public async getById(id: string): Promise<IProductFranchise | null> {
    return this.repo.findById(id);
  }

  // ==== Validation helpers =====
  private validatePriceBaseWithProduct(
    priceBase: number,
    product: { min_price: number; max_price: number },
    errors: IError[],
  ): void {
    if (priceBase < product.min_price || priceBase > product.max_price) {
      errors.push({
        field: BaseFieldName.PRICE_BASE,
        message: `Price must be between ${product.min_price} and ${product.max_price}`,
      });
    }
  }

  private normalizeSize(size: string): string {
    return size.trim().toUpperCase();
  }
}
