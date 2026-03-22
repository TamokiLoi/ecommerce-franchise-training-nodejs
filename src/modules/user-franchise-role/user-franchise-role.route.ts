import { Router } from "express";
import { API_PATH, SYSTEM_ADMIN_ROLES, SYSTEM_AND_FRANCHISE_ALL_ROLES, SYSTEM_AND_FRANCHISE_MANAGER_ROLES } from "../../core/constants";
import { IRoute } from "../../core/interfaces";
import { adminAuthMiddleware, requireMoreContext, validationMiddleware } from "../../core/middleware";
import CreateUserFranchiseRoleDto from "./dto/create.dto";
import { SearchPaginationItemDto } from "./dto/search.dto";
import UpdateUserFranchiseRoleDto from "./dto/update.dto";
import UserFranchiseRoleController from "./user-franchise-role.controller";

export default class UserFranchiseRoleRoute implements IRoute {
  public path = API_PATH.USER_FRANCHISE_ROLE;
  public router = Router();

  constructor(private readonly controller: UserFranchiseRoleController) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * tags:
     *   - name: UserFranchiseRole
     *     description: UserFranchiseRole related endpoints
     */

    // POST domain:/api/user-franchise-roles - Assign role to user for a franchise or set Super Admin
    this.router.post(
      this.path,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_ADMIN_ROLES),
      validationMiddleware(CreateUserFranchiseRoleDto),
      this.controller.createItem,
    );

    // GET domain:/api/user-franchise-roles/:id - Get item by id
    this.router.get(
      API_PATH.USER_FRANCHISE_ROLE_ID,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.getItem,
    );

    // POST domain:/api/user-franchise-roles/search - Search items with pagination
    this.router.post(
      API_PATH.USER_FRANCHISE_ROLE_SEARCH,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      validationMiddleware(SearchPaginationItemDto, true, { enableImplicitConversion: false }),
      this.controller.getItems,
    );

    // PUT domain:/api/user-franchise-roles/:id - Update item
    this.router.put(
      API_PATH.USER_FRANCHISE_ROLE_ID,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_ADMIN_ROLES),
      validationMiddleware(UpdateUserFranchiseRoleDto),
      this.controller.updateItem,
    );

    // DELETE domain:/api/user-franchise-roles/:id - Soft delete item
    this.router.delete(
      API_PATH.USER_FRANCHISE_ROLE_ID,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_ADMIN_ROLES),
      this.controller.softDeleteItem,
    );

    // PATCH domain:/api/user-franchise-roles/:id/restore - Restore soft deleted item
    this.router.patch(
      API_PATH.USER_FRANCHISE_ROLE_RESTORE,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_ADMIN_ROLES),
      this.controller.restoreItem,
    );

    // GET domain:/api/user-franchise-roles/user/:userId - Get user-franchise-roles by userId
    this.router.get(
      API_PATH.USER_FRANCHISE_ROLE_BY_USER_ID,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_MANAGER_ROLES),
      this.controller.getAllRolesByUserId,
    );

    // GET domain:/api/user-franchise-roles/franchise/:franchiseId - Get users by franchiseId
    this.router.get(
      API_PATH.USER_FRANCHISE_ROLE_BY_FRANCHISE_ID,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_ALL_ROLES),
      this.controller.getUsersByFranchiseId,
    );
  }
}
