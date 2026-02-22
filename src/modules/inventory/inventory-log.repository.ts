import { BaseRepository } from "../../core";
import InventoryLogSchema from "./inventory-log.model";
import { InventoryReferenceType } from "./inventory.enum";
import { IInventoryLog } from "./inventory.interface";

export class InventoryLogRepository extends BaseRepository<IInventoryLog> {
  constructor() {
    super(InventoryLogSchema);
  }

  public async getLogsByInventory(inventoryId: string): Promise<IInventoryLog[]> {
    return this.model.find({ inventory_id: inventoryId }).sort({ created_at: -1 });
  }

  public async getLogsByReference(
    referenceType: InventoryReferenceType,
    referenceId: string,
  ): Promise<IInventoryLog[]> {
    return this.model.find({
      reference_type: referenceType,
      reference_id: referenceId,
    });
  }
}
