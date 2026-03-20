import { Router } from "express";
import { adminAuthMiddleware, API_PATH, IRoute } from "../../core";
import { DashboardController } from "./dashboard.controller";

export default class DashboardRoute implements IRoute {
  public path = API_PATH.ORDER;
  public router = Router();

  constructor(private readonly controller: DashboardController) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * tags:
     *   - name: Dashboard
     *     description: Dashboard related endpoints
     */

    // GET domain:/api/dashboards?franchiseId= - Get dashboard info
    this.router.get(API_PATH.DASHBOARD, adminAuthMiddleware(), this.controller.getDashboardInfo);
  }
}
