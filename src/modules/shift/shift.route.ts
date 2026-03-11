import { Router } from "express";
import {
  API_PATH,
  adminAuthMiddleware,
  IRoute,
  SYSTEM_AND_FRANCHISE_ALL_ROLES,
  validationMiddleware,
  UpdateStatusDto,
  requireMoreContext,
  SYSTEM_AND_FRANCHISE_MANAGER_ROLES,
} from "../../core";
import { ShiftController } from "./shift.controller";
import { SearchPaginationItemDto } from "./dto/search.dto";
import CreateShiftDto from "./dto/create.dto";
import UpdateShiftDto from "./dto/update.dto";

export default class ShiftRoute implements IRoute {
  public path = API_PATH.SHIFT;
  public router = Router();

  constructor(private readonly controller: ShiftController) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * tags:
     *   - name: Shift
     *     description: Shift related endpoints
     */

    // GET domain:/api/shifts/select - Get select items and by franchiseId
    this.router.get(
      API_PATH.SHIFT_SELECT,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_ALL_ROLES),
      this.controller.getAllShifts,
    );

    // PATCH domain:/api/shifts/:id/status - Change status item
    this.router.patch(
      API_PATH.SHIFT_CHANGE_STATUS,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(UpdateStatusDto),
      this.controller.changeStatus,
    );

    // POST domain:/api/shifts - Create item
    this.router.post(
      this.path,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(CreateShiftDto),
      this.controller.createItem,
    );

    // POST domain:/api/shifts/search - Search items by conditions
    this.router.post(
      API_PATH.SHIFT_SEARCH,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_ALL_ROLES),
      validationMiddleware(SearchPaginationItemDto, true, {
        enableImplicitConversion: false,
      }),
      this.controller.getItems,
    );

    // GET domain:/api/shifts/:id - Get item
    this.router.get(
      API_PATH.SHIFT_ID,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_ALL_ROLES),
      this.controller.getItem,
    );

    // PUT domain:/api/shifts/:id - Update item
    this.router.put(
      API_PATH.SHIFT_ID,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(UpdateShiftDto),
      this.controller.updateItem,
    );

    // DELETE domain:/api/shifts/:id - Soft delete item
    this.router.delete(
      API_PATH.SHIFT_ID,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.softDeleteItem,
    );

    // PATCH domain:/api/shifts/:id/restore - Restore item
    this.router.patch(
      API_PATH.SHIFT_RESTORE,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.restoreItem,
    );
  }
}
