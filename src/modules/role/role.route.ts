import { Router } from "express";
import { API_PATH } from "../../core/constants";
import { BaseRole } from "../../core/enums";
import { IRoute } from "../../core/interfaces";
import { authMiddleware, requireGlobalRole } from "../../core/middleware";
import RoleController from "./role.controller";

export default class RoleRoute implements IRoute {
  public path = API_PATH.ROLE;
  public router = Router();

  constructor(private readonly controller: RoleController) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * tags:
     *   - name: Role
     *     description: Role related endpoints
     */

    /**
     * @swagger
     * /api/roles/migrate:
     *   get:
     *     summary: Migrate default roles
     *     tags: [Role]
     *     security:
     *       - bearerAuth: []
     *     description: |
     *       Initialize or migrate default system roles.
     *       This endpoint is typically used by admin during system setup or deployment.
     *     responses:
     *       200:
     *         description: Roles migrated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: "null"
     *                   example: null
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     *       500:
     *         description: Internal server error
     */
    // GET domain:/api/roles/migrate - Migrate roles
    this.router.get(
      "/migrate",
      authMiddleware(),
      requireGlobalRole(),
      this.controller.migrateRoles,
    );

    /**
     * @swagger
     * /api/roles:
     *   get:
     *     summary: Get all roles
     *     tags: [Role]
     *     security:
     *       - bearerAuth: []
     *     description: Retrieve all roles in the system.
     *     responses:
     *       200:
     *         description: Get roles successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       id:
     *                         type: integer
     *                         example: 1
     *                       code:
     *                         type: string
     *                         example: ADMIN
     *                       name:
     *                         type: string
     *                         example: Administrator
     *                       description:
     *                         type: string
     *                         example: System administrator role
     *                       scope:
     *                         type: string
     *                         enum:
     *                           - GLOBAL
     *                           - FRANCHISE
     *                         example: GLOBAL
     *                       created_at:
     *                         type: string
     *                         format: date-time
     *                         example: "2025-07-01T08:00:00Z"
     *                       updated_at:
     *                         type: string
     *                         format: date-time
     *                         example: "2025-07-01T08:00:00Z"
     *       401:
     *         description: Unauthorized
     *       500:
     *         description: Internal server error
     */
    // GET domain:/api/roles/select - Get all roles for select option
    this.router.get("/select", authMiddleware(), this.controller.getAllRoles);
  }
}
