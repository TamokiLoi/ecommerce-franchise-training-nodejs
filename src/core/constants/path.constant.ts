export const API_PATH = {
  // swagger api-docs
  API_DOCS: "/api-docs",

  // roles
  ROLE: "/api/roles",
  ROLE_MIGRATE: "/api/roles/migrate",
  ROLE_SELECT: "/api/roles/select",

  // audit logs
  AUDIT_LOG: "/api/audit-logs",
  AUDIT_LOG_ID: "/api/audit-logs/:id",
  AUDIT_LOG_SEARCH: "/api/audit-logs/search",
  AUDIT_LOG_SEARCH_BY_ENTITY: "/api/audit-logs/search-by-entity",

  // auth
  AUTH: "/api/auth",
  AUTH_REGISTER: "/api/auth/register",
  AUTH_LOGIN_SWAGGER: "/api/auth/login-swagger",
  AUTH_REFRESH_TOKEN: "/api/auth/refresh-token",
  AUTH_SWITCH_CONTEXT: "/api/auth/switch-context",
  AUTH_LOGOUT: "/api/auth/logout",
  AUTH_VERIFY_TOKEN: "/api/auth/verify-token",
  AUTH_RESEND_TOKEN: "/api/auth/resend-token",
  AUTH_FORGOT_PASSWORD: "/api/auth/forgot-password",
  AUTH_CHANGE_PASSWORD: "/api/auth/change-password",
  AUTH_TRIGGER_VERIFY_TOKEN: "/api/auth/trigger-verify-token",

  // franchises
  FRANCHISE: "/api/franchises",
  FRANCHISE_ID: "/api/franchises/:id",
  FRANCHISE_SEARCH: "/api/franchises/search",
  FRANCHISE_CHANGE_STATUS: "/api/franchises/:id/status",
  FRANCHISE_RESTORE: "/api/franchises/:id/restore",
  FRANCHISE_SELECT: "/api/franchises/select",

  // users
  USER: "/api/users",
  USER_ID: "/api/users/:id",
  USER_SEARCH: "/api/users/search",
  USER_CHANGE_STATUS: "/api/users/:id/change-status",
  USER_CHANGE_ROLE: "/api/users/:id/change-role",
  USER_ROLES: "/api/users/:id/roles",

  // user franchise roles
  USER_FRANCHISE_ROLE: "/api/user-franchise-roles",
  USER_FRANCHISE_ROLE_SEARCH: "/api/user-franchise-roles/search",
  USER_FRANCHISE_ROLE_ID: "/api/user-franchise-roles/:id",
  USER_FRANCHISE_ROLE_RESTORE: "/api/user-franchise-roles/:id/restore",

  // user franchise roles by user
  USER_FRANCHISE_ROLE_BY_USER_ID: "/api/user-franchise-roles/user/:userId",

  // categories
  CATEGORY: "/api/categories",
  CATEGORY_SEARCH: "/api/categories/search",
  CATEGORY_ID: "/api/categories/:id",
  CATEGORY_RESTORE: "/api/categories/:id/restore",
  CATEGORY_SELECT: "/api/categories/select",

  // products
  PRODUCT: "/api/products",
  PRODUCT_SEARCH: "/api/products/search",
  PRODUCT_ID: "/api/products/:id",
  PRODUCT_RESTORE: "/api/products/:id/restore",

  // category franchises
  CATEGORY_FRANCHISE: "/api/category-franchises", // assign categories to franchise
  CATEGORY_FRANCHISE_ID: "/api/category-franchises/:id", // get, update, delete category-franchise by id
  CATEGORY_FRANCHISE_SEARCH: "/api/category-franchises/search",
  CATEGORY_FRANCHISE_RESTORE: "/api/category-franchises/:id/restore", // restore category-franchise by id
  CATEGORY_FRANCHISE_CHANGE_STATUS: "/api/category-franchises/:id/status", // change status of category-franchise
  CATEGORY_FRANCHISE_CHANGE_DISPLAY_ORDER: "/api/category-franchises/display-order", // change display order of category-franchise
  CATEGORY_FRANCHISE_REORDER: "/api/category-franchises/reorder", // reorder categories of franchise
  GET_CATEGORIES_BY_FRANCHISE: "/api/category-franchises/franchise/:franchiseId", // get categories of franchise

  // product franchises
  PRODUCT_FRANCHISE: "/api/product-franchises",
  PRODUCT_FRANCHISE_ID: "/api/product-franchises/:id",
  PRODUCT_FRANCHISE_SEARCH: "/api/product-franchises/search",
  PRODUCT_FRANCHISE_RESTORE: "/api/product-franchises/:id/restore",
  PRODUCT_FRANCHISE_CHANGE_STATUS: "/api/product-franchises/:id/status",

  // product category franchises
  PRODUCT_CATEGORY_FRANCHISE: "/api/product-category-franchises",
  PRODUCT_CATEGORY_FRANCHISE_ID: "/api/product-category-franchises/:id",
  PRODUCT_CATEGORY_FRANCHISE_SEARCH: "/api/product-category-franchises/search",
  PRODUCT_CATEGORY_FRANCHISE_RESTORE: "/api/product-category-franchises/:id/restore",
  PRODUCT_CATEGORY_FRANCHISE_CHANGE_STATUS: "/api/product-category-franchises/:id/status",
  PRODUCT_CATEGORY_FRANCHISE_REORDER: "/api/product-category-franchises/reorder", // reorder product by category of franchise
  GET_PRODUCTS_BY_CATEGORY: "/api/product-category-franchises/:categoryId", // get product by category of franchise

  INVENTORY: "/api/inventories",
  INVENTORY_SEARCH: "/api/inventories/search",
  INVENTORY_ID: "/api/inventories/:id",
  INVENTORY_RESTORE: "/api/inventories/:id/restore",

  INVENTORY_ADJUST: "/api/inventories/adjust",
  INVENTORY_LOW_STOCK_BY_FRANCHISE: "/api/inventories/low-stock/franchise/:franchiseId",

  INVENTORY_LOGS: "/api/inventories/logs/:inventoryId",
  INVENTORY_LOGS_BY_REFERENCE: "/api/inventories/logs/reference",
};
