import { BaseItemSelectDto } from "../../core";
import { MSG_BUSINESS } from "../../core/constants";
import { BaseFieldName, HttpStatus } from "../../core/enums";
import { HttpException } from "../../core/exceptions";
import { IError } from "../../core/interfaces";
import { BaseCrudService } from "../../core/services";
import { checkEmptyObject, normalizeCode, normalizeText } from "../../core/utils";
import { AuditAction, AuditEntityType, buildAuditDiff, IAuditLogger, pickAuditSnapshot } from "../audit-log";
import CreateProductDto from "./dto/create.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import UpdateProductDto from "./dto/update.dto";
import { ProductFieldName } from "./product.enum";
import { IProduct, IProductQuery } from "./product.interface";
import { ProductRepository } from "./product.repository";

const AUDIT_FIELDS_ITEM = [
  ProductFieldName.SKU,
  BaseFieldName.NAME,
  BaseFieldName.DESCRIPTION,
  ProductFieldName.CONTENT,
  ProductFieldName.IMAGE_URL,
  ProductFieldName.IMAGES_URL,
  ProductFieldName.MIN_PRICE,
  ProductFieldName.MAX_PRICE,
] as readonly (keyof IProduct)[];

export class ProductService
  extends BaseCrudService<IProduct, CreateProductDto, UpdateProductDto, SearchPaginationItemDto>
  implements IProductQuery
{
  private readonly productRepo: ProductRepository;

  constructor(
    repo: ProductRepository,
    private readonly auditLogger: IAuditLogger,
  ) {
    super(repo);
    this.productRepo = repo;
  }

  // ===== Start CRUD =====

  protected async beforeCreate(dto: CreateProductDto, loggedUserId: string): Promise<void> {
    await checkEmptyObject(dto);

    const errors: IError[] = [];

    // 1. Normalize
    const normalizedSKU = normalizeCode(dto.SKU);
    const normalizedName = normalizeText(dto.name);

    // 2. Check unique SKU
    if (await this.repo.existsByField(ProductFieldName.SKU, normalizedSKU)) {
      errors.push({
        field: ProductFieldName.SKU,
        message: MSG_BUSINESS.ITEM_EXISTS("Product SKU"),
      });
    }

    // 3. Validate price range
    if (dto.min_price < 0 || dto.max_price < dto.min_price) {
      errors.push({
        field: "price",
        message: "Invalid product price range",
      });
    }

    if (errors.length) {
      throw new HttpException(HttpStatus.BadRequest, "", errors);
    }

    // 4. Mutate dto (service level is OK)
    dto.SKU = normalizedSKU;
    dto.name = normalizedName;
  }

  protected async afterCreate(item: IProduct, loggedUserId: string): Promise<void> {
    const snapshot = pickAuditSnapshot(item, AUDIT_FIELDS_ITEM);
    await this.auditLogger.log({
      entityType: AuditEntityType.PRODUCT,
      entityId: String(item._id),
      action: AuditAction.CREATE,
      newData: snapshot,
      changedBy: loggedUserId,
    });
  }

  protected async beforeUpdate(current: IProduct, dto: UpdateProductDto, loggedUserId: string): Promise<void> {
    await checkEmptyObject(dto);

    const errors: IError[] = [];

    const nextSKU = dto.SKU ? normalizeCode(dto.SKU) : current.SKU;
    const nextName = dto.name ? normalizeText(dto.name) : current.name;

    // 1. Unique SKU (exclude itself)
    if (
      dto.SKU &&
      (await this.repo.existsByField(ProductFieldName.SKU, nextSKU, { excludeId: current._id.toString() }))
    ) {
      errors.push({
        field: ProductFieldName.SKU,
        message: MSG_BUSINESS.ITEM_EXISTS("Product SKU"),
      });
    }

    // 2. Validate price range (partial update safe)
    const minPrice = dto.min_price ?? current.min_price;
    const maxPrice = dto.max_price ?? current.max_price;

    if (minPrice < 0 || maxPrice < minPrice) {
      errors.push({
        field: "price",
        message: "Invalid product price range",
      });
    }

    if (errors.length) {
      throw new HttpException(HttpStatus.BadRequest, "", errors);
    }

    // 3. Normalize
    if (dto.SKU) dto.SKU = nextSKU;
    if (dto.name) dto.name = nextName;
  }

  protected async afterUpdate(oldItem: IProduct, newItem: IProduct, loggedUserId: string): Promise<void> {
    const { oldData, newData } = buildAuditDiff(oldItem, newItem, AUDIT_FIELDS_ITEM);

    if (newData && Object.keys(newData).length > 0) {
      await this.auditLogger.log({
        entityType: AuditEntityType.PRODUCT,
        entityId: String(oldItem._id),
        action: AuditAction.UPDATE,
        oldData,
        newData,
        changedBy: loggedUserId,
      });
    }
  }

  protected async afterDelete(item: IProduct, loggedUserId: string): Promise<void> {
    await this.auditLogger.log({
      entityType: AuditEntityType.PRODUCT,
      entityId: String(item._id),
      action: AuditAction.SOFT_DELETE,
      oldData: { is_deleted: false },
      newData: { is_deleted: true },
      changedBy: loggedUserId,
    });
  }

  protected async afterRestore(item: IProduct, loggedUserId: string): Promise<void> {
    await this.auditLogger.log({
      entityType: AuditEntityType.PRODUCT,
      entityId: String(item._id),
      action: AuditAction.RESTORE,
      oldData: { is_deleted: true },
      newData: { is_deleted: false },
      changedBy: loggedUserId,
    });
  }

  protected async doSearch(dto: SearchPaginationItemDto): Promise<{ data: IProduct[]; total: number }> {
    return this.productRepo.getItems(dto);
  }

  // Support for api get all products (no pagination, no filter)
  public async getAllItems(): Promise<BaseItemSelectDto[]> {
    const items = await this.repo.findAll();
    const newItems = items.map((item) => ({
      value: String(item._id),
      code: item.SKU,
      name: item.name,
    }));

    return newItems;
  }

  // ===== End CRUD =====

  // Method external
  public async getById(id: string): Promise<IProduct | null> {
    return this.productRepo.findById(id);
  }
}
