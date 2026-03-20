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
  USER_CHANGE_STATUS: "/api/users/:id/status",
  USER_RESTORE: "/api/users/:id/restore",
  USER_CHANGE_ROLE: "/api/users/:id/change-role",
  USER_ROLES: "/api/users/:id/roles",
  USER_FIND: "/api/users/find",

  // user franchise roles
  USER_FRANCHISE_ROLE: "/api/user-franchise-roles",
  USER_FRANCHISE_ROLE_SEARCH: "/api/user-franchise-roles/search",
  USER_FRANCHISE_ROLE_ID: "/api/user-franchise-roles/:id",
  USER_FRANCHISE_ROLE_RESTORE: "/api/user-franchise-roles/:id/restore",

  // user franchise roles by user
  USER_FRANCHISE_ROLE_BY_USER_ID: "/api/user-franchise-roles/user/:userId",

  // get users by franchise
  USER_FRANCHISE_ROLE_BY_FRANCHISE_ID: "/api/user-franchise-roles/franchise/:franchiseId",

  // customer auth
  CUSTOMER_AUTH: "/api/customer-auth",
  CUSTOMER_AUTH_LOGOUT: "/api/customer-auth/logout",
  CUSTOMER_AUTH_REFRESH_TOKEN: "/api/customer-auth/refresh-token",
  CUSTOMER_AUTH_VERIFY_TOKEN: "/api/customer-auth/verify-token",
  CUSTOMER_AUTH_RESEND_TOKEN: "/api/customer-auth/resend-token",
  CUSTOMER_AUTH_FORGOT_PASSWORD: "/api/customer-auth/forgot-password",
  CUSTOMER_AUTH_CHANGE_PASSWORD: "/api/customer-auth/change-password",

  // customer
  CUSTOMER: "/api/customers",
  CUSTOMER_ID: "/api/customers/:id",
  CUSTOMER_SEARCH: "/api/customers/search",
  CUSTOMER_CHANGE_STATUS: "/api/customers/:id/status",
  CUSTOMER_RESTORE: "/api/customers/:id/restore",
  CUSTOMER_REGISTER: "/api/customers/register",
  CUSTOMER_FIND: "/api/customers/find",

  // customer franchises
  CUSTOMER_FRANCHISE: "/api/customer-franchises",
  CUSTOMER_FRANCHISE_ID: "/api/customer-franchises/:id",
  CUSTOMER_FRANCHISE_SEARCH: "/api/customer-franchises/search",
  CUSTOMER_FRANCHISE_RESTORE: "/api/customer-franchises/:id/restore",
  CUSTOMER_FRANCHISE_CHANGE_STATUS: "/api/customer-franchises/:id/status",

  // loyalty rule
  LOYALTY_RULE: "/api/loyalty-rules",
  LOYALTY_RULE_SEARCH: "/api/loyalty-rules/search",
  LOYALTY_RULE_ID: "/api/loyalty-rules/:id",
  GET_LOYALTY_RULE_BY_FRANCHISE: "/api/loyalty-rules/franchise/:franchiseId",

  // loyalty transaction
  LOYALTY_TRANSACTION: "/api/loyalty-transactions",

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
  PRODUCT_SELECT: "/api/products/select",

  // promotions
  PROMOTION: "/api/promotions",
  PROMOTION_SEARCH: "/api/promotions/search",
  PROMOTION_ID: "/api/promotions/:id",
  PROMOTION_RESTORE: "/api/promotions/:id/restore",
  PROMOTION_CHANGE_STATUS: "/api/promotions/:id/status",
  GET_PROMOTIONS_BY_FRANCHISE: "/api/promotions/franchise/:franchiseId",
  GET_PROMOTIONS_BY_PRODUCT_FRANCHISE: "/api/promotions/product-franchise/:productFranchiseId",

  // vouchers
  VOUCHER: "/api/vouchers",
  VOUCHER_SEARCH: "/api/vouchers/search",
  VOUCHER_ID: "/api/vouchers/:id",
  VOUCHER_RESTORE: "/api/vouchers/:id/restore",
  VOUCHER_CHANGE_STATUS: "/api/vouchers/:id/status",
  GET_VOUCHERS_BY_FRANCHISE: "/api/vouchers/franchise/:franchiseId",
  GET_VOUCHERS_BY_PRODUCT_FRANCHISE: "/api/vouchers/product-franchise/:productFranchiseId",

  // category franchises
  CATEGORY_FRANCHISE: "/api/category-franchises", // assign categories to franchise
  CATEGORY_FRANCHISE_ID: "/api/category-franchises/:id", // get, update, delete category-franchise by id
  CATEGORY_FRANCHISE_SEARCH: "/api/category-franchises/search",
  CATEGORY_FRANCHISE_RESTORE: "/api/category-franchises/:id/restore", // restore category-franchise by id
  CATEGORY_FRANCHISE_CHANGE_STATUS: "/api/category-franchises/:id/status", // change status of category-franchise
  CATEGORY_FRANCHISE_CHANGE_DISPLAY_ORDER: "/api/category-franchises/:id/display-order", // change display order of category-franchise
  CATEGORY_FRANCHISE_REORDER: "/api/category-franchises/reorder", // reorder categories of franchise
  GET_CATEGORIES_BY_FRANCHISE: "/api/category-franchises/franchise/:franchiseId", // get categories of franchise

  // product franchises
  PRODUCT_FRANCHISE: "/api/product-franchises",
  PRODUCT_FRANCHISE_ID: "/api/product-franchises/:id",
  PRODUCT_FRANCHISE_SEARCH: "/api/product-franchises/search",
  PRODUCT_FRANCHISE_RESTORE: "/api/product-franchises/:id/restore",
  PRODUCT_FRANCHISE_CHANGE_STATUS: "/api/product-franchises/:id/status",
  GET_PRODUCTS_BY_FRANCHISE: "/api/product-franchises/franchise/:franchiseId",

  // product category franchises
  PRODUCT_CATEGORY_FRANCHISE: "/api/product-category-franchises",
  PRODUCT_CATEGORY_FRANCHISE_ID: "/api/product-category-franchises/:id",
  PRODUCT_CATEGORY_FRANCHISE_SEARCH: "/api/product-category-franchises/search",
  PRODUCT_CATEGORY_FRANCHISE_RESTORE: "/api/product-category-franchises/:id/restore",
  PRODUCT_CATEGORY_FRANCHISE_CHANGE_STATUS: "/api/product-category-franchises/:id/status",
  PRODUCT_CATEGORY_FRANCHISE_REORDER: "/api/product-category-franchises/reorder", // reorder product by category of franchise
  GET_PRODUCTS_BY_CATEGORY: "/api/product-category-franchises/:categoryId", // get product by category of franchise
  GET_PRODUCTS_WITH_CATEGORY_BY_FRANCHISE: "/api/product-category-franchises/franchise/:franchiseId",

  INVENTORY: "/api/inventories",
  INVENTORY_SEARCH: "/api/inventories/search",
  INVENTORY_ID: "/api/inventories/:id",
  INVENTORY_RESTORE: "/api/inventories/:id/restore",

  INVENTORY_ADJUST: "/api/inventories/adjust",
  INVENTORY_ADJUST_BULK: "/api/inventories/adjust/bulk",
  INVENTORY_LOW_STOCK_BY_FRANCHISE: "/api/inventories/low-stock/franchise/:franchiseId",

  INVENTORY_LOGS: "/api/inventories/logs/:inventoryId",
  INVENTORY_LOGS_BY_REFERENCE: "/api/inventories/logs/reference",

  SHIFT: "/api/shifts",
  SHIFT_SEARCH: "/api/shifts/search",
  SHIFT_ID: "/api/shifts/:id",
  SHIFT_RESTORE: "/api/shifts/:id/restore",
  SHIFT_CHANGE_STATUS: "/api/shifts/:id/status",
  SHIFT_SELECT: "/api/shifts/select",
  GET_ALL_SHIFT_BY_FRANCHISE: "/api/shifts/franchise/:franchiseId",

  SHIFT_ASSIGNMENT: "/api/shift-assignments",
  SHIFT_ASSIGNMENT_SEARCH: "/api/shift-assignments/search",
  SHIFT_ASSIGNMENT_ID: "/api/shift-assignments/:id",
  SHIFT_ASSIGNMENT_RESTORE: "/api/shift-assignments/:id/restore",
  SHIFT_ASSIGNMENT_CHANGE_STATUS: "/api/shift-assignments/:id/status",
  SHIFT_ASSIGNMENT_BULK: "/api/shift-assignments/bulk",
  SHIFT_ASSIGNMENT_USER_ID: "/api/shift-assignments/user/:userId",
  SHIFT_ASSIGNMENT_FRANCHISE_ID: "/api/shift-assignments/franchise/:franchiseId",
  SHIFT_ASSIGNMENT_BY_SHIFT_ID: "/api/shift-assignments/shift/:shiftId",

  // client
  CLIENT: "/api/clients",
  CLIENT_FRANCHISES: "/api/clients/franchises",
  CLIENT_CATEGORIES: "/api/clients/franchises/:franchiseId/categories",
  CLIENT_MENU: "/api/clients/menu",
  CLIENT_PRODUCTS: "/api/clients/products",
  CLIENT_PRODUCT_DETAIL: "/api/clients/franchises/:franchiseId/products/:productId",
  CLIENT_FRANCHISE_DETAIL: "/api/clients/franchises/:franchiseId",
  CLIENT_FRANCHISE_LOYALTY_RULE: "/api/clients/franchises/:franchiseId/loyalty-rule",
  CLIENT_CUSTOMER_LOYALTY: "/api/clients/franchises/:franchiseId/customer-loyalty",

  // cart, cartItem
  CART: "/api/carts",
  CART_ID: "/api/carts/:id",
  COUNT_CART_ITEM: "/api/carts/:id/count-cart-item",
  COUNT_CART_BY_CUSTOMER: "/api/carts/customer/:customerId/count-cart",
  CART_ITEM: "/api/carts/items",
  GET_CARTS_BY_CUSTOMER: "/api/carts/customer/:customerId",
  CART_ITEM_STAFF: "/api/carts/items/staff",
  CART_ITEM_STAFF_BULK: "/api/carts/items/staff-bulk",
  CART_ITEM_ID: "/api/carts/items/:cartItemId",
  UPDATE_CART_ITEM: "/api/carts/items/update-cart-item",
  UPDATE_OPTIONS_IN_CART_ITEM: "/api/carts/items/update-options-cart-item",
  UPDATE_OPTION_ITEM: "/api/carts/items/update-option",
  REMOVE_OPTION_ITEM: "/api/carts/items/remove-option",
  ADD_CART_ITEM: "/api/carts/items",
  APPLY_VOUCHER: "/api/carts/:id/apply-voucher",
  REMOVE_VOUCHER: "/api/carts/:id/remove-voucher",
  CHECKOUT_CART: "/api/carts/:id/checkout",
  CANCEL_CART: "/api/carts/:id/cancel",

  // order
  ORDER: "/api/orders",
  ORDER_ID: "/api/orders/:id",
  ORDER_CODE: "/api/orders/code",
  ORDER_SEARCH: "/api/orders/search",
  ORDER_RESTORE: "/api/orders/:id/restore",
  ORDER_CHANGE_STATUS: "/api/orders/:id/status",
  ORDER_BY_STAFF: "/api/orders/staff/:staffId",
  GET_ORDER_BY_CART: "/api/orders/cart/:cartId",
  GET_ORDERS_BY_CUSTOMER: "/api/orders/customer/:customerId",
  GET_ORDERS_BY_FRANCHISE: "/api/orders/franchise/:franchiseId",
  PREPARING_ORDER: "/api/orders/:id/preparing",
  READY_FOR_PICKUP_ORDER: "/api/orders/:id/ready-for-pickup",

  // order status logs
  ORDER_STATUS_LOG: "/api/order-status-logs",

  // payment
  PAYMENT: "/api/payments",
  PAYMENT_ID: "/api/payments/:id",
  PAYMENT_CODE: "/api/payments/code",
  CONFIRM_PAYMENT: "/api/payments/:id/confirm",
  REFUND_PAYMENT: "/api/payments/:id/refund",
  RETRY_PAYMENT: "/api/payments/:id/retry",
  PAYMENT_FAILED: "/api/payments/:id/failed",
  GET_PAYMENT_BY_ORDER: "/api/payments/order/:orderId",
  GET_PAYMENTS_BY_CUSTOMER: "/api/payments/customer/:customerId",

  // refund
  REFUND: "/api/refunds",

  // delivery
  DELIVERY: "/api/deliveries",
  DELIVERY_ID: "/api/deliveries/:id",
  GET_DELIVERY_BY_ORDER: "/api/deliveries/order/:orderId",
  SEARCH_DELIVERIES: "/api/deliveries/search",
  PICKUP_DELIVERY: "/api/deliveries/:deliveryId/pickup",
  COMPLETE_DELIVERY: "/api/deliveries/:deliveryId/complete",

  // dashboard
  DASHBOARD: "/api/dashboards",
};
