import { IAuditLogger } from "../audit-log";
import { ICategoryFranchiseQuery, PublicCategoryFranchiseItemDto } from "../category-franchise";
import { IFranchiseQuery } from "../franchise";
import { IProductFranchiseQuery, PublicProductDetailDto, PublicProductItemDto } from "../product-franchise";

export class ClientService {
  constructor(
    private readonly auditLogger: IAuditLogger,
    private readonly franchiseQuery: IFranchiseQuery,
    private readonly categoryFranchiseQuery: ICategoryFranchiseQuery,
    private readonly productFranchiseQuery: IProductFranchiseQuery,
  ) {}

  // Get list franchise
  public async getFranchises() {
    return this.franchiseQuery.getPublicFranchises();
  }

  // Get list category by franchise
  public async getCategoriesByFranchise(franchiseId: string): Promise<PublicCategoryFranchiseItemDto[]> {
    return this.categoryFranchiseQuery.getPublicCategoriesByFranchiseId(franchiseId);
  }

  // Get menu (list category + product) by franchise
  public async getMenuByFranchise(franchiseId: string, categoryId?: string) {
    return this.productFranchiseQuery.getMenuByFranchise(franchiseId, categoryId);
  }

  // Get list product in franchise, filter by category
  public async getProductsByFranchiseAndCategory(
    franchiseId: string,
    categoryId: string,
  ): Promise<PublicProductItemDto[]> {
    return this.productFranchiseQuery.getPublicProducts(franchiseId, categoryId);
  }

  // Get product detail
  public async getProductDetail(franchiseId: string, productId: string): Promise<PublicProductDetailDto | null> {
    return this.productFranchiseQuery.getPublicProductDetail(franchiseId, productId);
  }
}
