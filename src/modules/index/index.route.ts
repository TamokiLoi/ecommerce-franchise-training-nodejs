import { Router } from "express";
import { IRoute } from "../../core/interfaces";
import IndexController from "./index.controller";
import { API_PATH } from "../../core/constants";
import { authMiddleware } from "../../core/middleware";

export default class IndexRoute implements IRoute {
  public path = "/";
  public router = Router();

  constructor(private readonly indexController: IndexController) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * tags:
     *   - name: Index
     *     description: Index Default
     */

    /**
     * @swagger
     * /:
     *   get:
     *     summary: Index API - check server status
     *     tags: [Index]
     *     responses:
     *       200:
     *         description: Server is running
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 message:
     *                   type: string
     *                   example: API is running
     */
    this.router.get(this.path, this.indexController.index);

    /**
     * @swagger
     * /api/roles:
     *   get:
     *     summary: Get all system roles
     *     tags: [Role]
     *     security:
     *       - Bearer: []
     *     responses:
     *       200:
     *         description: Get list of roles successfully
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
     *                       key:
     *                         type: string
     *                         example: ADMIN
     *                       value:
     *                         type: string
     *                         example: admin
     *       401:
     *         description: Unauthorized - missing or invalid token
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: false
     *                 message:
     *                   type: string
     *                   example: Unauthorized
     */
    // GET domain:/api/roles - Get all role
    this.router.get(API_PATH.ROLE, authMiddleware(), this.indexController.getAllRole);
  }
}
