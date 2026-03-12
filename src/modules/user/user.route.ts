import { Router } from "express";
import { UpdateStatusDto } from "../../core";
import {
  API_PATH,
  SYSTEM_ADMIN_ROLES,
  SYSTEM_AND_FRANCHISE_ALL_ROLES,
  SYSTEM_AND_FRANCHISE_MANAGER_ROLES,
} from "../../core/constants";
import { IRoute } from "../../core/interfaces";
import { adminAuthMiddleware, requireMoreContext, validationMiddleware } from "../../core/middleware";
import CreateUserDto from "./dto/create.dto";
import UpdateUserDto from "./dto/update.dto";
import UserController from "./user.controller";

export default class UserRoute implements IRoute {
  public path = API_PATH.USER;
  public router = Router();

  constructor(private readonly controller: UserController) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * tags:
     *   - name: User
     *     description: User related endpoints
     */

    // GET domain:/api/users/find?keyword="" -> Search users for select items by name or email
    this.router.get(
      API_PATH.USER_FIND,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_ALL_ROLES),
      this.controller.searchByKeyword,
    );

    // PATCH domain:/api/users/:id/status -> Change user status (block/unBlock)
    this.router.patch(
      API_PATH.USER_CHANGE_STATUS,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_ADMIN_ROLES),
      validationMiddleware(UpdateStatusDto),
      this.controller.changeStatus,
    );

    // POST domain:/api/users - Create item
    this.router.post(
      this.path,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_ADMIN_ROLES),
      validationMiddleware(CreateUserDto),
      this.controller.createItem,
    );

    // POST domain:/api/users/search - Search items with pagination
    this.router.post(
      API_PATH.USER_SEARCH,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.getItems,
    );

    // GET domain:/api/users/:id - Get item
    this.router.get(API_PATH.USER_ID, adminAuthMiddleware(), this.controller.getItem);

    // PUT domain:/api/users/:id - Update item
    this.router.put(
      API_PATH.USER_ID,
      adminAuthMiddleware(),
      validationMiddleware(UpdateUserDto),
      this.controller.updateItem,
    );

    // DELETE domain:/api/users/:id - Soft delete item
    this.router.delete(
      API_PATH.USER_ID,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_ADMIN_ROLES),
      this.controller.softDeleteItem,
    );

    // PATCH domain:/api/users/:id/restore - Restore soft deleted item
    this.router.patch(
      API_PATH.USER_RESTORE,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_ADMIN_ROLES),
      this.controller.restoreItem,
    );
  }
}
