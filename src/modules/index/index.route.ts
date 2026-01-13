import { Router } from "express";
import { IRoute } from "../../core/interfaces";
import IndexController from "./index.controller";

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
  }
}
