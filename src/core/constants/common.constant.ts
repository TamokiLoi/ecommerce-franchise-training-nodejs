import { BaseFieldName, BaseRole, RoleScope } from "../enums";

export const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;

export const ACCOUNT_DEFAULT = [
  process.env.SUPER_ADMIN_EMAIL,
  process.env.ADMIN_EMAIL,
  process.env.MANAGER_EMAIL,
  process.env.STAFF_EMAIL,
  process.env.ADMIN_EMAIL_GROUP_1,
  process.env.ADMIN_EMAIL_GROUP_2,
  process.env.ADMIN_EMAIL_GROUP_3,
  process.env.ADMIN_EMAIL_GROUP_4,
];

export const PASSWORD_LENGTH_MIN = 8;
export const PHONE_LENGTH_MIN = 10;

export const PAGINATION = {
  pageNum: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 0,
};

export const SYSTEM_ADMIN_ROLES = [{ scope: RoleScope.GLOBAL, roles: [BaseRole.SUPER_ADMIN, BaseRole.ADMIN] }];

export const SYSTEM_AND_FRANCHISE_MANAGER_ROLES = [
  { scope: RoleScope.GLOBAL, roles: [BaseRole.SUPER_ADMIN, BaseRole.ADMIN] },
  { scope: RoleScope.FRANCHISE, roles: [BaseRole.MANAGER] },
];

export const SYSTEM_AND_FRANCHISE_ALL_ROLES = [
  { scope: RoleScope.GLOBAL, roles: [BaseRole.SUPER_ADMIN, BaseRole.ADMIN] },
  { scope: RoleScope.FRANCHISE, roles: [BaseRole.MANAGER, BaseRole.STAFF] },
];

export const BASE_MODEL_FIELDS = {
  [BaseFieldName.IS_ACTIVE]: { type: Boolean, default: true },
  [BaseFieldName.CREATED_AT]: { type: Date, default: Date.now },
  [BaseFieldName.UPDATED_AT]: { type: Date, default: Date.now },
  [BaseFieldName.IS_DELETED]: { type: Boolean, default: false },
};

export const BASE_MODEL_FIELDS_NO_ACTIVE = {
  [BaseFieldName.CREATED_AT]: { type: Date, default: Date.now },
  [BaseFieldName.UPDATED_AT]: { type: Date, default: Date.now },
  [BaseFieldName.IS_DELETED]: { type: Boolean, default: false },
};

