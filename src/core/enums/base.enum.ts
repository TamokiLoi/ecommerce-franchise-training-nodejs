export const GLOBAL_FRANCHISE_ID = null;

export enum BaseRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  STAFF = "STAFF",
  SHIPPER = "SHIPPER",
  USER = "USER",
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

export enum BaseFieldName {
  ID = "_id",
  IS_ACTIVE = "is_active",
  CREATED_AT = "created_at",
  UPDATED_AT = "updated_at",
  IS_DELETED = "is_deleted",
  CODE = "code",
  NAME = "name",
  DESCRIPTION = "description",
  DISPLAY_ORDER = "display_order",
  SCOPE = "scope", // GLOBAL/FRANCHISE

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
  CREATED_BY = "created_by"

}
