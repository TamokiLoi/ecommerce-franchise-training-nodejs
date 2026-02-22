import dotenv from "dotenv";
import App from "./app";
import { validateEnv } from "./core/utils";
import { AuditLogModule } from "./modules/audit-log";
import { AuthModule } from "./modules/auth";
import { CategoryModule } from "./modules/category";
import { CategoryFranchiseModule } from "./modules/category-franchise";
import { FranchiseModule } from "./modules/franchise";
import { IndexModule } from "./modules/index";
import { InventoryModule } from "./modules/inventory";
import { ProductModule } from "./modules/product";
import { ProductCategoryFranchiseModule } from "./modules/product-category-franchise";
import { ProductFranchiseModule } from "./modules/product-franchise";
import { RoleModule } from "./modules/role";
import { UserModule } from "./modules/user";
import { UserFranchiseRoleModule } from "./modules/user-franchise-role";

dotenv.config();
validateEnv();

// ===== Core / infra =====
const indexModule = new IndexModule();
const auditLogModule = new AuditLogModule();

// ===== Domain modules (singleton) =====
const franchiseModule = new FranchiseModule();
const userModule = new UserModule();
const roleModule = new RoleModule();
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

// ===== Register routes =====
const routes = [
  indexModule.getRoute(),
  auditLogModule.getRoute(),
  authModule.getRoute(),
  franchiseModule.getRoute(),
  roleModule.getRoute(),
  userModule.getRoute(),
  userFranchiseRoleModule.getRoute(),
  categoryModule.getRoute(),
  productModule.getRoute(),
  categoryFranchiseModule.getRoute(),
  productFranchiseModule.getRoute(),
  productCategoryFranchiseModule.getRoute(),
  inventoryModule.getRoute(),
];

const app = new App(routes);
app.listen();
