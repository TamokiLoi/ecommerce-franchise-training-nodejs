import dotenv from "dotenv";
import App from "./app";
import { logger, validateEnv } from "./core/utils";
import { AuditLogModule } from "./modules/audit-log";
import { AuthModule } from "./modules/auth";
import { CartModule } from "./modules/cart";
import { CartItemModule } from "./modules/cart-item";
import { CategoryModule } from "./modules/category";
import { CategoryFranchiseModule } from "./modules/category-franchise";
import { ClientModule } from "./modules/client";
import { CustomerModule } from "./modules/customer";
import { CustomerAuthModule } from "./modules/customer-auth";
import { CustomerFranchiseModule } from "./modules/customer-franchise";
import { FranchiseModule } from "./modules/franchise";
import { IndexModule } from "./modules/index";
import { InventoryModule } from "./modules/inventory";
import { ProductModule } from "./modules/product";
import { ProductCategoryFranchiseModule } from "./modules/product-category-franchise";
import { ProductFranchiseModule } from "./modules/product-franchise";
import { PromotionModule } from "./modules/promotion/promotion.module";
import { RoleModule } from "./modules/role";
import { ShiftModule } from "./modules/shift";
import { ShiftAssignmentModule } from "./modules/shift-assignment";
import { UserModule } from "./modules/user";
import { UserFranchiseRoleModule } from "./modules/user-franchise-role";
import { VoucherModule } from "./modules/voucher/voucher.module";

dotenv.config();
validateEnv();

// ===== Core / infra =====
const indexModule = new IndexModule();
const auditLogModule = new AuditLogModule();

// ===== Domain modules (singleton) =====
const franchiseModule = new FranchiseModule();
const userModule = new UserModule();
const roleModule = new RoleModule();
const customerModule = new CustomerModule();
const categoryModule = new CategoryModule();
const productModule = new ProductModule();

// ===== Dependent modules =====
const userFranchiseRoleModule = new UserFranchiseRoleModule(userModule, roleModule, franchiseModule);
const authModule = new AuthModule(userFranchiseRoleModule, userModule);
const categoryFranchiseModule = new CategoryFranchiseModule(categoryModule, franchiseModule);
const productFranchiseModule = new ProductFranchiseModule(productModule, franchiseModule);
const productCategoryFranchiseModule = new ProductCategoryFranchiseModule(
  franchiseModule,
  categoryFranchiseModule,
  productFranchiseModule,
);
const inventoryModule = new InventoryModule(productModule, productFranchiseModule);
const customerAuthModule = new CustomerAuthModule(customerModule);
const customerFranchiseModule = new CustomerFranchiseModule(franchiseModule, customerModule);
const promotionModule = new PromotionModule(productFranchiseModule);
const voucherModule = new VoucherModule(productFranchiseModule);

// Public module (export to client)
const clientModule = new ClientModule(franchiseModule, categoryFranchiseModule, productFranchiseModule);
const cartItemModule = new CartItemModule();
const cartModule = new CartModule(customerModule, franchiseModule, productFranchiseModule, cartItemModule);

const shiftModule = new ShiftModule();
const shiftAssignmentModule = new ShiftAssignmentModule(userModule, shiftModule, userFranchiseRoleModule);
shiftModule.setShiftAssignmentQuery(shiftAssignmentModule.getShiftAssignmentQuery());
// ===== Register routes =====
const routes = [
  indexModule.getRoute(),
  auditLogModule.getRoute(),
  authModule.getRoute(),
  franchiseModule.getRoute(),
  roleModule.getRoute(),
  userModule.getRoute(),
  userFranchiseRoleModule.getRoute(),
  customerModule.getRoute(),
  customerAuthModule.getRoute(),
  customerFranchiseModule.getRoute(),
  categoryModule.getRoute(),
  productModule.getRoute(),
  categoryFranchiseModule.getRoute(),
  productFranchiseModule.getRoute(),
  productCategoryFranchiseModule.getRoute(),
  inventoryModule.getRoute(),
  promotionModule.getRoute(),
  voucherModule.getRoute(),
  shiftModule.getRoute(),
  shiftAssignmentModule.getRoute(),

  // Public route
  clientModule.getRoute(),
  cartItemModule.getRoute(),
  cartModule.getRoute(),
];

async function bootstrap() {
  try {
    const app = new App(routes);
    await app.connectToDatabase();
    app.listen();
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1); // crash nếu DB fail
  }
}

bootstrap();
