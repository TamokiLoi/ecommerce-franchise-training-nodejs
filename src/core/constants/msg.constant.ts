export const MSG = {
  TIME_HH_MM: "Time must be in HH:mm format (00:00 - 23:59)",
};

export const MSG_BUSINESS = {
  ITEM_EXISTS: (field: string) => `${field} already exists`,
  ITEM_NOT_EXISTS: "Item does not exist",
  ITEM_NOT_FOUND: "Item not found",
  ITEM_NOT_FOUND_OR_RESTORED: "Item not found or has been restored",
  OPENED_BEFORE_CLOSED: "Opened time must be before closed time",
  CLOSED_AFTER_OPENED: "Closed time must be after opened time",
  STATUS_NO_CHANGE: "Status of item has not changed",
};
