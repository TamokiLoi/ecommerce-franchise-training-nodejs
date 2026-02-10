export const MSG = {
  TIME_HH_MM: "Time must be in HH:mm format (00:00 - 23:59)",
};

export const MSG_BUSINESS = {
  DATABASE_QUERY_FAILED: "Database query failed",
  ROLE_MIGRATION_FAILED: "Role migration failed, default roles may already exist",
  NO_DATA_TO_UPDATE: "No data to update",
  ITEM_EXISTS: (field: string) => `${field} already exists`,
  ITEMS_EXISTS: (field: string) => `Some ${field} already exist`,
  DUPLICATE_ITEMS_IN_REQUEST: (field: string) => `Duplicate ${field} items in request`,
  DUPLICATE_IDS_IN_REQUEST: (field: string) => `Request contains duplicate ${field} IDs`,
  ITEM_NOT_EXISTS: "Item does not exist",
  ITEM_NOT_FOUND: "Item not found",
  ITEM_NOT_FOUND_WITH_NAME: (name: string) => `${name} not found`,
  ITEM_NOT_FOUND_OR_RESTORED: "Item not found or has been restored",
  OPENED_BEFORE_CLOSED: "Opened time must be before closed time",
  CLOSED_AFTER_OPENED: "Closed time must be after opened time",
  STATUS_NO_CHANGE: "Status of item has not changed",
  CANNOT_CHANGE_TO_GLOBAL_ROLE: "User only has a FRANCHISE role and cannot change to a GLOBAL role",
  CANNOT_CHANGE_TO_FRANCHISE_ROLE: "User only has a GLOBAL role and cannot change to a FRANCHISE role",
  CANNOT_REMOVE_OWN_GLOBAL_ROLE: "Cannot remove your own global role",
  USER_ALREADY_HAS_ROLE_IN_FRANCHISE: "User already has a role in this franchise",
  ITEMS_NOT_FOUND: "Some items were not found",
};
