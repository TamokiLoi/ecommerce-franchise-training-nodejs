import { Router } from "express";
import {
  adminAuthMiddleware,
  API_PATH,
  IRoute,
  requireMoreContext,
  SYSTEM_AND_FRANCHISE_ALL_ROLES,
  SYSTEM_AND_FRANCHISE_MANAGER_ROLES,
  validationMiddleware,
} from "../../core";
import validationBulkMiddleware from "../../core/middleware/validationbulk.middleware";
import { CreateShiftAssignmentDto } from "./dto/create.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import { ShiftAssignmentController } from "./shift-assignment.controller";
import { UpdateStatusDto } from "./dto/update.dto";

export default class ShiftAssignmentRoute implements IRoute {
  public path = API_PATH.SHIFT_ASSIGNMENT;
  public router = Router();

  constructor(private readonly controller: ShiftAssignmentController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @swagger
     * tags:
     *   - name: ShiftAssignment
     *     description: Shift assignment related endpoints
     */

    // PATCH domain:/api/shift-assignments/:id/status - Change item status
    this.router.patch(
      API_PATH.SHIFT_ASSIGNMENT_CHANGE_STATUS,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_ALL_ROLES),
      validationMiddleware(UpdateStatusDto),
      this.controller.changeStatus,
    );

    // POST domain:/api/shift-assignments - Create item
    this.router.post(
      this.path,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(CreateShiftAssignmentDto),
      this.controller.createItem,
    );

    // POST domain:/api/shift-assignments/bulk - Create items
    this.router.post(
      API_PATH.SHIFT_ASSIGNMENT_BULK,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationBulkMiddleware(CreateShiftAssignmentDto),
      this.controller.createItems,
    );

    // GET domain:/api/shift-assignments/search - Search items by conditions
    this.router.post(
      API_PATH.SHIFT_ASSIGNMENT_SEARCH,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_ALL_ROLES),
      validationMiddleware(SearchPaginationItemDto),
      this.controller.getItems,
    );

    // GET domain:/api/shift-assignments/user/:userId - Get shift assignment detail by userId and date
    this.router.get(
      API_PATH.SHIFT_ASSIGNMENT_USER_ID,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_ALL_ROLES),
      this.controller.getShiftAssignmentByUserId,
    );

    // GET domain:/api/shift-assignments/franchise/:franchiseId - Get shift assignment detail by franchiseId
    this.router.get(
      API_PATH.SHIFT_ASSIGNMENT_FRANCHISE_ID,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_ALL_ROLES),
      this.controller.getAllByFranchiseIdAndDate,
    );

    // GET domain:/api/shift-assignments/shift/:shiftId - Get shift assignment detail by shiftId
    this.router.get(
      API_PATH.SHIFT_ASSIGNMENT_BY_SHIFT_ID,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_ALL_ROLES),
      this.controller.getAllByShiftIdAndDate,
    );

    // GET domain:/api/shift-assignments/:id - Get item
    this.router.get(
      API_PATH.SHIFT_ASSIGNMENT_ID,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_ALL_ROLES),
      this.controller.getItem,
    );

    // DELETE domain:/api/shift-assignments/:id - Delete item
    this.router.delete(
      API_PATH.SHIFT_ASSIGNMENT_ID,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.softDeleteItem,
    );

    // PATCH domain:/api/shift-assignments/:id/restore - Restore item
    this.router.patch(
      API_PATH.SHIFT_ASSIGNMENT_RESTORE,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.restoreItem,
    );
  }
}
