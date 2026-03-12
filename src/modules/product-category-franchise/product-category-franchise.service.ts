import {
  BaseCrudService,
  BaseFieldName,
  checkEmptyObject,
  HttpException,
  HttpStatus,
  IError,
  MSG_BUSINESS,
  UpdateStatusDto,
} from "../../core";
import { AuditAction, AuditEntityType, IAuditLogger, pickAuditSnapshot } from "../audit-log";
import { ICategoryFranchiseQuery } from "../category-franchise";
import { IFranchiseQuery } from "../franchise";
import { IProductFranchiseQuery } from "../product-franchise";
import { CreateProductCategoryFranchiseDto } from "./dto/create.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import { UpdateProductCategoryFranchiseDto } from "./dto/update.dto";
import { UpdateDisplayOrderItemDto } from "./dto/updateDisplayOrder.dto";
import { IProductCategoryFranchise, IProductCategoryFranchiseQuery } from "./product-category-franchise.interface";
import { ProductCategoryFranchiseRepository } from "./product-category-franchise.repository";

const AUDIT_FIELDS_ITEM = [
  BaseFieldName.CATEGORY_FRANCHISE_ID,
  BaseFieldName.PRODUCT_FRANCHISE_ID,
  BaseFieldName.DISPLAY_ORDER,
] as readonly (keyof IProductCategoryFranchise)[];

export class ProductCategoryFranchiseService
  extends BaseCrudService<
    IProductCategoryFranchise,
    CreateProductCategoryFranchiseDto,
    UpdateProductCategoryFranchiseDto,
    SearchPaginationItemDto
  >
  implements IProductCategoryFranchiseQuery
{
  private readonly productCategoryFranchiseRepo: ProductCategoryFranchiseRepository;

  constructor(
    repo: ProductCategoryFranchiseRepository,
    private readonly auditLogger: IAuditLogger,
    private readonly franchiseQuery: IFranchiseQuery,
    private readonly categoryFranchiseQuery: ICategoryFranchiseQuery,
    private readonly productFranchiseQuery: IProductFranchiseQuery,
  ) {
    super(repo);
    this.productCategoryFranchiseRepo = repo;
  }

  // ===== Start CRUD =====
  protected async beforeCreate(dto: CreateProductCategoryFranchiseDto, loggedUserId: string): Promise<void> {
    await checkEmptyObject(dto);

    const { category_franchise_id, product_franchise_id } = dto;
    const errors: IError[] = [];

    // 1️⃣ Check category_franchise exists -> check category exists in franchise
    const categoryFranchise = await this.categoryFranchiseQuery.getById(category_franchise_id);
    if (!categoryFranchise) {
      errors.push({
        field: BaseFieldName.CATEGORY_FRANCHISE_ID,
        message: MSG_BUSINESS.ITEM_NOT_FOUND_WITH_NAME("Category Franchise"),
      });
    }

    // 2️⃣ Check product_franchise exists -> check product exists in franchise
    const productFranchise = await this.productFranchiseQuery.getById(product_franchise_id);
    if (!productFranchise) {
      errors.push({
        field: BaseFieldName.PRODUCT_FRANCHISE_ID,
        message: MSG_BUSINESS.ITEM_NOT_FOUND_WITH_NAME("Product Franchise"),
      });
    }

    // 3️⃣ Check category_franchise and product_franchise belong to same franchise (only check if both entities exist)
    if (categoryFranchise && productFranchise) {
      const categoryFranchiseId = String(categoryFranchise.franchise_id);
      const productFranchiseId = String(productFranchise.franchise_id);

      if (categoryFranchiseId !== productFranchiseId) {
        const [categoryFranchiseInfo, productFranchiseInfo] = await Promise.all([
          this.franchiseQuery.getById(categoryFranchiseId),
          this.franchiseQuery.getById(productFranchiseId),
        ]);

        errors.push({
          field: BaseFieldName.PRODUCT_FRANCHISE_ID,
          message: `Product belongs to franchise "${productFranchiseInfo?.name}" but category belongs to franchise "${categoryFranchiseInfo?.name}". They not must match.`,
        });
      }
    }

    // 4️⃣ Check duplicate (only check if both entities exist)
    if (categoryFranchise && productFranchise) {
      const existed = await this.productCategoryFranchiseRepo.findByCategoryAndProduct(
        category_franchise_id,
        product_franchise_id,
      );

      if (existed) {
        if (existed.is_deleted) {
          // 👇 Production-level improvement: restore instead of error
          await this.productCategoryFranchiseRepo.restoreById(String(existed._id));
          return;
        }

        errors.push({
          field: BaseFieldName.PRODUCT_FRANCHISE_ID,
          message: "Product already assigned to this category",
        });
      }
    }

    if (errors.length) {
      throw new HttpException(HttpStatus.BadRequest, "", errors);
    }
  }

  protected async afterCreate(item: IProductCategoryFranchise, loggedUserId: string): Promise<void> {
    const snapshot = pickAuditSnapshot(item, AUDIT_FIELDS_ITEM);

    await this.auditLogger.log({
      entityType: AuditEntityType.PRODUCT_CATEGORY_FRANCHISE,
      entityId: String(item._id),
      action: AuditAction.CREATE,
      newData: snapshot,
      changedBy: loggedUserId,
    });
  }

  protected async afterDelete(item: IProductCategoryFranchise, loggedUserId: string): Promise<void> {
    await this.auditLogger.log({
      entityType: AuditEntityType.PRODUCT_CATEGORY_FRANCHISE,
      entityId: String(item._id),
      action: AuditAction.SOFT_DELETE,
      oldData: { is_deleted: false },
      newData: { is_deleted: true },
      changedBy: loggedUserId,
    });
  }

  protected async afterRestore(item: IProductCategoryFranchise, loggedUserId: string): Promise<void> {
    await this.auditLogger.log({
      entityType: AuditEntityType.PRODUCT_CATEGORY_FRANCHISE,
      entityId: String(item._id),
      action: AuditAction.RESTORE,
      oldData: { is_deleted: true },
      newData: { is_deleted: false },
      changedBy: loggedUserId,
    });
  }

  protected async doSearch(
    dto: SearchPaginationItemDto,
  ): Promise<{ data: IProductCategoryFranchise[]; total: number }> {
    return this.productCategoryFranchiseRepo.getItems(dto);
  }

  public async getItem(id: string): Promise<IProductCategoryFranchise> {
    const item = await this.productCategoryFranchiseRepo.getItem(id);
    if (!item) {
      throw new HttpException(HttpStatus.BadRequest, MSG_BUSINESS.ITEM_NOT_FOUND);
    }
    return item;
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
      entityType: AuditEntityType.PRODUCT_CATEGORY_FRANCHISE,
      entityId: id,
      action: AuditAction.CHANGE_STATUS,
      oldData: { is_active: currentItem.is_active },
      newData: { is_active },
      changedBy: loggedUserId,
    });
  }

  /**
   * Reorder product-category-franchise items (drag & drop)
   */
  public async reorderCategoriesInFranchise(dto: UpdateDisplayOrderItemDto, loggedUserId: string): Promise<void> {
    const { category_franchise_id, item_id, new_position } = dto;

    if (new_position < 1) {
      throw new HttpException(HttpStatus.BadRequest, "Invalid position");
    }

    // 1️⃣ Validate category exists in franchise
    const category = await this.categoryFranchiseQuery.getById(category_franchise_id);

    if (!category) {
      throw new HttpException(HttpStatus.NotFound, MSG_BUSINESS.ITEM_NOT_FOUND_WITH_NAME("Category Franchise"));
    }

    // 2️⃣ Load full list (active + not deleted)
    const items = await this.productCategoryFranchiseRepo.findByCategory(category_franchise_id, true);

    if (!items.length) {
      throw new HttpException(HttpStatus.BadRequest, "Category has no items");
    }

    // 3️⃣ Sort in correct order
    items.sort((a, b) => a.display_order - b.display_order);

    // 4️⃣ Find current index
    const currentIndex = items.findIndex((i) => String(i._id) === item_id);

    if (currentIndex === -1) {
      throw new HttpException(HttpStatus.BadRequest, "Item does not belong to this category");
    }

    // 5️⃣ Clamp new_position
    const safeIndex = Math.min(Math.max(new_position - 1, 0), items.length - 1);

    // 6️⃣ Remove item from old position
    const [movedItem] = items.splice(currentIndex, 1);

    // 7️⃣ Insert into new position
    items.splice(safeIndex, 0, movedItem);

    // 8️⃣ Recalculate display_order
    const updatedItems = items.map((item, index) => ({
      id: String(item._id),
      display_order: index + 1,
    }));

    // 9️⃣ Bulk update
    await this.productCategoryFranchiseRepo.bulkUpdateOrderByCategory(category_franchise_id, updatedItems);

    // 🔟 Audit (summary only)
    await this.auditLogger.log({
      entityType: AuditEntityType.PRODUCT_CATEGORY_FRANCHISE,
      entityId: category_franchise_id,
      action: AuditAction.DISPLAY_ORDER,
      note: `Move item ${item_id} to position ${new_position}`,
      changedBy: loggedUserId,
    });
  }

  public async getProductsWithCategoriesByFranchise(franchiseId: string) {
    // 1️⃣ get data từ 2 repo
    const productFranchiseItems = await this.productFranchiseQuery.getProductsByFranchiseId(franchiseId);

    const productCategoryFranchiseItems =
      await this.productCategoryFranchiseRepo.getProductsWithCategories(franchiseId);

    // 2️⃣ tạo map để lookup categories theo product_franchise_id
    const categoryMap = new Map<string, any[]>();

    for (const item of productCategoryFranchiseItems) {
      categoryMap.set(item.product_franchise_id.toString(), item.categories || []);
    }

    // 3️⃣ merge product + categories
    const result = productFranchiseItems.map((product) => ({
      ...product,
      categories: categoryMap.get(product.product_franchise_id?.toString()) || [],
    }));

    // 4️⃣ sort để các size của cùng product đứng gần nhau
    result.sort((a, b) => a.product_id.localeCompare(b.product_id));

    return result;
  }
  // Support for IProductCategoryFranchiseQuery
  // TODO: consider caching for better performance
  public async getById(id: string): Promise<IProductCategoryFranchise | null> {
    return this.repo.findById(id);
  }
}
