export const GLOBAL_FRANCHISE_ID = null;

export enum BaseRole {
  SUPER_ADMIN = "SUPER_ADMIN", // SYSTEM / GLOBAL
  ADMIN = "ADMIN", // SYSTEM / GLOBAL

  MANAGER = "MANAGER", // FRANCHISE
  STAFF = "STAFF", // FRANCHISE
  SHIPPER = "SHIPPER", // FRANCHISE
  USER = "USER", // FRANCHISE
}

export enum RoleScope {
  GLOBAL = "GLOBAL",
  FRANCHISE = "FRANCHISE",
}

export enum BaseField {
  ID = "id",
  IS_ACTIVE = "is_active",
  CREATED_AT = "created_at",
  UPDATED_AT = "updated_at",
  IS_DELETED = "is_deleted",
}

export enum BaseGroup {
  SYSTEM = "system",
  GROUP_01 = "group_01",
  GROUP_02 = "group_02",
  GROUP_03 = "group_03",
  GROUP_04 = "group_04",
}

export enum BaseLoyaltyTier {
  BRONZE = "BRONZE", // 0 - 299 points
  SILVER = "SILVER", // 300 - 999 points
  GOLD = "GOLD", // 1000 - 1999 points
  PLATINUM = "PLATINUM", // 2000+ points
}

export enum CartStatus {
  ACTIVE = "ACTIVE",
  CHECKED_OUT = "CHECKED_OUT",
}

export enum BaseFieldName {
  ID = "_id",
  IS_ACTIVE = "is_active",
  CREATED_AT = "created_at",
  UPDATED_AT = "updated_at",
  IS_DELETED = "is_deleted",
  CODE = "code",
  NAME = "name",
  EMAIL = "email",
  PHONE = "phone",
  AVATAR_URL = "avatar_url",
  PASSWORD = "password",
  DESCRIPTION = "description",
  DISPLAY_ORDER = "display_order",
  SCOPE = "scope", // GLOBAL/FRANCHISE
  ADDRESS = "address",
  STATUS = "status",

  // Collection Id
  FRANCHISE_ID = "franchise_id",
  USER_ID = "user_id",
  ROLE_ID = "role_id",
  CATEGORY_ID = "category_id",
  PRODUCT_ID = "product_id",
  CATEGORY_FRANCHISE_ID = "category_franchise_id",
  PRODUCT_FRANCHISE_ID = "product_franchise_id",
  PRODUCT_CATEGORY_FRANCHISE_ID = "product_category_franchise_id",
  INVENTORY_ID = "inventory_id",
  SHIFT_ID = "shift_id",
  SHIFT_ASSIGNMENT_ID = "shift_assignment_id",
  CUSTOMER_ID = "customer_id",
  CUSTOMER_FRANCHISE_ID = "customer_franchise_id",
  STAFF_ID = "staff_id",
  VOUCHER_ID = "voucher_id",
  CART_ID = "cart_id",
  CART_ITEM_ID = "cart_item_id",
  CART_ITEM_OPTION_ID = "cart_item_option_id",

  REFERENCE_TYPE = "reference_type",
  REFERENCE_ID = "reference_id",

  // Other common fields
  SIZE = "size",
  PRICE_BASE = "price_base",
  NOTE = "note",
  QUANTITY = "quantity",
  RESERVED_QUANTITY = "reserved_quantity",
  ALERT_THRESHOLD = "alert_threshold",
  TYPE = "type",
  CHANGE = "change",
  REASON = "reason",
  CREATED_BY = "created_by",


  // Add more fields as needed
  IS_VERIFIED = "is_verified",
  VERIFICATION_TOKEN = "verification_token",
  VERIFICATION_TOKEN_EXPIRES = "verification_token_expires",
  TOKEN_VERSION = "token_version",
  WORK_DATE = "work_date",
  ASSIGNED_BY = "assigned_by",

  LAST_RESET_PASSWORD_AT = "last_reset_password_at",

  // For Customer
  STAFF_NAME = "staff_name",
  FRANCHISE_NAME = "franchise_name",
  CUSTOMER_NAME = "customer_name",
  CUSTOMER_EMAIL = "customer_email",
  CUSTOMER_PHONE = "customer_phone",
  LOYALTY_POINTS = "loyalty_points", // default 0
  LOYALTY_TIER = "loyalty_tier", // BRONZE, SILVER, GOLD, PLATINUM
  FIRST_ORDER_DATE = "first_order_date",
  LAST_ORDER_DATE = "last_order_date",
  TOTAL_EARNED_POINTS = "total_earned_points",
  PROMOTION_DISCOUNT = "promotion_discount",
  VOUCHER_DISCOUNT = "voucher_discount",
  LOYALTY_DISCOUNT = "loyalty_discount",
  FINAL_AMOUNT = "final_amount",
  SUBTOTAL_AMOUNT = "subtotal_amount",
  LOYALTY_POINTS_USED = "loyalty_points_used",
  VOUCHER_CODE = "voucher_code",
  PRODUCT_CART_PRICE = "product_cart_price",
  DISCOUNT_AMOUNT = "discount_amount",
  LINE_TOTAL = "line_total",
  FINAL_LINE_TOTAL = "final_line_total",
  OPTIONS_HASH = "options_hash",
  OPTIONS = "options",
  PRICE_SNAPSHOT = "price_snapshot",
  FINAL_PRICE = "final_price",
}

export enum ShiftAssignmentStatus {
    ASSIGNED = "ASSIGNED",
    COMPLETED = "COMPLETED",
    ABSENT = "ABSENT",
}