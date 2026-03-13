import { IAuditLogger } from "../audit-log";
import { ICategoryFranchiseQuery, PublicCategoryFranchiseItemDto } from "../category-franchise";
import { IFranchise, IFranchiseQuery, IFranchiseQueryResult } from "../franchise";
import { ILoyaltyRule, ILoyaltyRuleQuery } from "../loyalty-rule";
import { IProductFranchiseQuery, PublicProductDetailDto, PublicProductItemDto } from "../product-franchise";

export class ClientService {
  constructor(
    private readonly auditLogger: IAuditLogger,
    private readonly franchiseQuery: IFranchiseQuery,
    private readonly categoryFranchiseQuery: ICategoryFranchiseQuery,
    private readonly productFranchiseQuery: IProductFranchiseQuery,
    private readonly loyaltyRuleQuery: ILoyaltyRuleQuery,
  ) {}

  // Get list franchise
  public async getFranchises(): Promise<IFranchiseQueryResult[]> {
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

  // Get franchise detail
  public async getFranchiseDetail(franchiseId: string): Promise<IFranchise | null> {
    return this.franchiseQuery.getById(franchiseId);
  }

  // Get loyalty rule by franchise
  public async getLoyaltyRuleByFranchise(franchiseId: string): Promise<ILoyaltyRule> {
    return this.loyaltyRuleQuery.getRoyaltyRuleByFranchiseId(franchiseId);
  }
}
