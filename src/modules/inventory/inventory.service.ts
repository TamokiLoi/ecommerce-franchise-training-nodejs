import { ClientSession } from "mongoose";
import {
  BaseCrudService,
  BaseFieldName,
  checkEmptyObject,
  HttpException,
  HttpStatus,
  MSG_BUSINESS,
  toObjectId,
} from "../../core";
import { AuditAction, AuditEntityType, IAuditLogger, pickAuditSnapshot } from "../audit-log";
import { IProductQuery } from "../product";
import { CreateInventoryDto } from "./dto/create.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import { InventoryLogRepository } from "./inventory-log.repository";
import { InventoryReferenceType, InventoryType } from "./inventory.enum";
import { IInventory, IInventoryQuery } from "./inventory.interface";
import { InventoryRepository } from "./inventory.repository";
import { IProductFranchiseQuery } from "../product-franchise";
import { UpdateInventoryQuantityDto } from "./dto/update.dto";

const AUDIT_FIELDS_ITEM = [
  BaseFieldName.PRODUCT_FRANCHISE_ID,
  BaseFieldName.QUANTITY,
  BaseFieldName.RESERVED_QUANTITY,
  BaseFieldName.ALERT_THRESHOLD,
] as readonly (keyof IInventory)[];

export class InventoryService
  extends BaseCrudService<IInventory, CreateInventoryDto, never, SearchPaginationItemDto>
  implements IInventoryQuery
{
  private readonly inventoryRepository: InventoryRepository;
  private readonly inventoryLogRepository: InventoryLogRepository;

  constructor(
    repo: InventoryRepository,
    inventoryLogRepo: InventoryLogRepository,
    private readonly auditLogger: IAuditLogger,
    private readonly productQuery: IProductQuery,
    private readonly productFranchiseQuery: IProductFranchiseQuery,
  ) {
    super(repo);
    this.inventoryRepository = repo;
    this.inventoryLogRepository = inventoryLogRepo;
  }

  // ================= SEARCH =================
  protected async doSearch(dto: SearchPaginationItemDto): Promise<{ data: IInventory[]; total: number }> {
    return this.inventoryRepository.getItems(dto);
  }

  // ================= ADJUST =================
  public async adjustStock(payload: UpdateInventoryQuantityDto, loggedUserId: string, session?: ClientSession) {
    const { product_franchise_id, change, reason } = payload;
    const inventory = await this.inventoryRepository.findByProductFranchiseId(product_franchise_id);
    if (!inventory) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.ITEM_NOT_FOUND_WITH_NAME("Inventory"));
    }

    const success = await this.inventoryRepository.adjustStock(product_franchise_id, change, session);
    if (!success) {
      throw new HttpException(HttpStatus.BadRequest, "Invalid stock adjustment");
    }

    await this.inventoryLogRepository.create(
      {
        inventory_id: inventory._id,
        product_franchise_id: inventory.product_franchise_id,
        change,
        type: InventoryType.ADJUST,
        reference_type: InventoryReferenceType.MANUAL,
        reason,
        created_by: toObjectId(loggedUserId),
      },
      session,
    );
  }

  // ================= RESERVE =================
  public async reserveStock(
    productFranchiseId: string,
    quantity: number,
    orderId: string,
    loggedUserId: string,
    session?: ClientSession,
  ) {
    const inventory = await this.inventoryRepository.findByProductFranchiseId(productFranchiseId);
    if (!inventory) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.ITEM_NOT_FOUND_WITH_NAME("Inventory"));
    }

    const success = await this.inventoryRepository.reserveStock(productFranchiseId, quantity, session);
    if (!success) {
      throw new HttpException(HttpStatus.BadRequest, "Not enough stock");
    }

    await this.inventoryLogRepository.create(
      {
        inventory_id: inventory._id,
        product_franchise_id: inventory.product_franchise_id,
        change: quantity,
        type: InventoryType.RESERVE,
        reference_type: InventoryReferenceType.ORDER,
        reference_id: toObjectId(orderId),
        created_by: toObjectId(loggedUserId),
      },
      session,
    );
  }

  // ================= RELEASE =================
  public async releaseStock(
    productFranchiseId: string,
    quantity: number,
    orderId: string,
    loggedUserId: string,
    session?: ClientSession,
  ) {
    await this.inventoryRepository.releaseStock(productFranchiseId, quantity, session);

    await this.inventoryLogRepository.create(
      {
        inventory_id: undefined, // có thể tìm trước nếu muốn strict
        product_franchise_id: toObjectId(productFranchiseId),
        change: -quantity,
        type: InventoryType.RELEASE,
        reference_type: InventoryReferenceType.ORDER,
        reference_id: toObjectId(orderId),
        created_by: toObjectId(loggedUserId),
      },
      session,
    );
  }

  // ================= DEDUCT =================
  public async deductStock(
    productFranchiseId: string,
    quantity: number,
    orderId: string,
    loggedUserId: string,
    session?: ClientSession,
  ) {
    await this.inventoryRepository.deductStock(productFranchiseId, quantity, session);

    await this.inventoryLogRepository.create(
      {
        inventory_id: undefined,
        product_franchise_id: toObjectId(productFranchiseId),
        change: -quantity,
        type: InventoryType.DEDUCT,
        reference_type: InventoryReferenceType.ORDER,
        reference_id: toObjectId(orderId),
        created_by: toObjectId(loggedUserId),
      },
      session,
    );
  }

  // ================= LOW STOCK =================
  public async findLowStock(franchiseId?: string) {
    return this.inventoryRepository.findLowStock(franchiseId);
  }

  // ===== Get logs by inventory =====
  public async getLogsByInventory(inventoryId: string) {
    const inventory = await this.repo.findById(inventoryId);
    if (!inventory) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.ITEM_NOT_FOUND_WITH_NAME("Inventory"));
    }
    return this.inventoryLogRepository.getLogsByInventory(inventoryId);
  }

  // ===== Get logs by reference =====
  public async getLogsByReference(referenceType: InventoryReferenceType, referenceId: string) {
    return this.inventoryLogRepository.getLogsByReference(referenceType, referenceId);
  }

  // ===== Start CRUD =====
  protected async beforeCreate(dto: CreateInventoryDto, loggedUserId: string): Promise<void> {
    await checkEmptyObject(dto);

    const { product_franchise_id } = dto;

    // 1. Validate product_franchise exists
    const productFranchise = await this.productFranchiseQuery.getById(product_franchise_id);
    if (!productFranchise) {
      throw new HttpException(HttpStatus.BadRequest, "Product franchise not found");
    }

    // 2. Prevent duplicate inventory
    const existed = await this.inventoryRepository.findByProductFranchiseId(product_franchise_id);
    if (existed) {
      throw new HttpException(HttpStatus.BadRequest, "Inventory already exists for this product franchise");
    }
  }

  protected async afterCreate(item: IInventory, loggedUserId: string): Promise<void> {
    const snapshot = pickAuditSnapshot(item, AUDIT_FIELDS_ITEM);
    await this.auditLogger.log({
      entityType: AuditEntityType.INVENTORY,
      entityId: String(item._id),
      action: AuditAction.CREATE,
      newData: snapshot,
      changedBy: loggedUserId,
    });
  }

  protected async afterDelete(item: IInventory, loggedUserId: string): Promise<void> {
    await this.auditLogger.log({
      entityType: AuditEntityType.INVENTORY,
      entityId: String(item._id),
      action: AuditAction.SOFT_DELETE,
      oldData: { is_deleted: false },
      newData: { is_deleted: true },
      changedBy: loggedUserId,
    });
  }

  protected async afterRestore(item: IInventory, loggedUserId: string): Promise<void> {
    await this.auditLogger.log({
      entityType: AuditEntityType.INVENTORY,
      entityId: String(item._id),
      action: AuditAction.RESTORE,
      oldData: { is_deleted: true },
      newData: { is_deleted: false },
      changedBy: loggedUserId,
    });
  }
  // ===== End CRUD =====

  // ===== Query for external modules =====
  public async getById(id: string): Promise<IInventory | null> {
    return this.inventoryRepository.findById(id);
  }

  public async getByProductFranchiseId(productFranchiseId: string): Promise<IInventory | null> {
    return this.inventoryRepository.findByProductFranchiseId(productFranchiseId);
  }
}
