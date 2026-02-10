import { BaseRepository } from "../../core/repository";
import { ICategoryFranchise } from "./category-franchise.interface";
import CategoryFranchiseSchema from "./category-franchise.model";

export class CategoryFranchiseRepository extends BaseRepository<ICategoryFranchise> {
  constructor() {
    super(CategoryFranchiseSchema);
  }

  // check if a category is already assigned to a franchise
  public async findByCategoryAndFranchise(categoryId: string, franchiseId: string) {
    return this.model.findOne({
      category_id: categoryId,
      franchise_id: franchiseId,
      is_deleted: false,
    });
  }

  // get all categories assigned to a franchise
  public findByFranchise(franchiseId: string, isActive: boolean | undefined) {
    const filter: any = {
      franchise_id: franchiseId,
      is_deleted: false,
      is_active: isActive !== undefined ? isActive : { $in: [true, false] },
    };

    return this.model.find(filter).sort({ display_order: 1, created_at: 1 });
  }

  // bulk update display order of categories for a franchise
  public async bulkUpdateOrder(items: { id: string; display_order: number }[]) {
    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item.id, is_deleted: false },
        update: { $set: { display_order: item.display_order } },
      },
    }));

    return this.model.bulkWrite(bulkOps);
  }

  public async deactivateByFranchise(franchiseId: string) {
    return this.model.updateMany({ franchise_id: franchiseId }, { $set: { is_active: false } });
  }
}
