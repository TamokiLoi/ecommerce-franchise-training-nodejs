import { Router } from "express";
import {
  API_PATH,
  authMiddleware,
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

    /**
     * @swagger
     * /api/shifts/search:
     *   post:
     *     summary: Search shifts with pagination
     *     tags: [Shift]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               searchCondition:
     *                 type: object
     *                 properties:
     *                   name:
     *                     type: string
     *                   franchise_id:
     *                     type: string
     *               pageInfo:
     *                 type: object
     *                 required: [pageNum, pageSize]
     *                 properties:
     *                   pageNum:
     *                     type: integer
     *                     default: 1
     *                   pageSize:
     *                     type: integer
     *                     default: 10
     *     responses:
     *       200:
     *         description: Get shifts successfully
     */
    this.router.post(
      API_PATH.SHIFT_SEARCH,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_ALL_ROLES),
      validationMiddleware(SearchPaginationItemDto, true, {
        enableImplicitConversion: false,
      }),
      this.controller.getItems,
    );

    /**
     * @swagger
     * /api/shifts:
     *   post:
     *     summary: Create new shift
     *     tags: [Shift]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [name, franchise_id, start_time, end_time]
     *             properties:
     *               name:
     *                 type: string
     *               franchise_id:
     *                 type: string
     *               start_time:
     *                 type: string
     *               end_time:
     *                 type: string
     *     responses:
     *       200:
     *         description: Created successfully
     */
    this.router.post(
      API_PATH.SHIFT,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(CreateShiftDto),
      this.controller.createItem,
    );

    /**
     * @swagger
     * /api/shifts/select:
     *   get:
     *     summary: Get active shifts
     *     tags: [Shift]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: franchise_id
     *         required: true
     *         schema:
     *           type: string
     *         description: Franchise ID to filter shifts by
     *     responses:
     *       200:
     *         description: List of shifts for select
     */
    this.router.get(
      API_PATH.SHIFT_SELECT,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_ALL_ROLES),
      this.controller.getAllShifts,
    );

    /**
     * @swagger
     * /api/shifts/{id}:
     *   get:
     *     summary: Get shift detail
     *     tags: [Shift]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Get shift successfully
     */
    this.router.get(
      API_PATH.SHIFT_ID,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_ALL_ROLES),
      this.controller.getAllShiftsByFranchiseId,
    );

    /**
     * @swagger
     * /api/shifts/{id}:
     *   put:
     *     summary: Update shift
     *     tags: [Shift]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *               start_time:
     *                 type: string
     *               end_time:
     *                 type: string
     *     responses:
     *       200:
     *         description: Updated successfully
     */
    this.router.put(
      API_PATH.SHIFT_ID,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(UpdateShiftDto),
      this.controller.updateItem,
    );

    /**
     * @swagger
     * /api/shifts/{id}:
     *   delete:
     *     summary: Soft delete shift
     *     tags: [Shift]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Deleted successfully
     */
    this.router.delete(
      API_PATH.SHIFT_ID,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.softDeleteItem,
    );

    /**
     * @swagger
     * /api/shifts/{id}/restore:
     *   patch:
     *     summary: Restore shift
     *     tags: [Shift]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Restored successfully
     */
    this.router.patch(
      API_PATH.SHIFT_RESTORE,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.restoreItem,
    );

    /**
     * @swagger
     * /api/shifts/{id}/status:
     *   patch:
     *     summary: Change shift status
     *     tags: [Shift]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [is_active]
     *             properties:
     *               is_active:
     *                 type: boolean
     *     responses:
     *       200:
     *         description: Status changed successfully
     */
    this.router.patch(
      API_PATH.SHIFT_CHANGE_STATUS,
      authMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(UpdateStatusDto),
      this.controller.changeStatus,
    );
  }
}
