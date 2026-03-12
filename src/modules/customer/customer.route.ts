import { Router } from "express";
import {
  adminAuthMiddleware,
  API_PATH,
  authMiddleware,
  customerAuthMiddleware,
  IRoute,
  requireMoreContext,
  SYSTEM_ADMIN_ROLES,
  SYSTEM_AND_FRANCHISE_ALL_ROLES,
  SYSTEM_AND_FRANCHISE_MANAGER_ROLES,
  UpdateStatusDto,
  validationMiddleware,
} from "../../core";
import { CustomerController } from "./customer.controller";
import CreateCustomerDto from "./dto/create.dto";
import UpdateCustomerDto from "./dto/update.dto";

export default class CustomerRoute implements IRoute {
  public path = API_PATH.CUSTOMER;
  public router = Router();

  constructor(private readonly controller: CustomerController) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * tags:
     *   - name: Customer
     *     description: Customer related endpoints
     */

    // GET domain:/api/customers/find?keyword="" -> Search customer for select items by: name, email, phone
    this.router.get(
      API_PATH.CUSTOMER_FIND,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_ALL_ROLES),
      this.controller.searchByKeyword,
    );

    // POST domain:/api/customers/register - Register new customer (used by self-end-user registration)
    this.router.post(API_PATH.CUSTOMER_REGISTER, validationMiddleware(CreateCustomerDto), this.controller.createItem);

    // PATCH domain:/api/customers/:id/status -> Change customer status (block/unBlock)
    this.router.patch(
      API_PATH.CUSTOMER_CHANGE_STATUS,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_ADMIN_ROLES),
      validationMiddleware(UpdateStatusDto),
      this.controller.changeStatus,
    );

    // POST domain:/api/customers - Create item
    this.router.post(
      this.path,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_ALL_ROLES),
      validationMiddleware(CreateCustomerDto),
      this.controller.createItem,
    );

    // POST domain:/api/customers/search - Search items with pagination
    this.router.post(
      API_PATH.CUSTOMER_SEARCH,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_AND_FRANCHISE_ALL_ROLES),
      this.controller.getItems,
    );

    // GET domain:/api/customers/:id - Get item
    this.router.get(API_PATH.CUSTOMER_ID, authMiddleware(), this.controller.getItem);

    // PUT domain:/api/customers/:id - Update item
    this.router.put(
      API_PATH.CUSTOMER_ID,
      authMiddleware(),
      validationMiddleware(UpdateCustomerDto),
      this.controller.updateItem,
    );

    // DELETE domain:/api/customers/:id - Soft delete item
    this.router.delete(
      API_PATH.CUSTOMER_ID,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_ADMIN_ROLES),
      this.controller.softDeleteItem,
    );

    // PATCH domain:/api/customers/:id/restore - Restore soft deleted item
    this.router.patch(
      API_PATH.CUSTOMER_RESTORE,
      adminAuthMiddleware(),
      requireMoreContext(SYSTEM_ADMIN_ROLES),
      this.controller.restoreItem,
    );
  }
}
