export const GLOBAL_FRANCHISE_ID = "__GLOBAL__";

export enum BaseRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    STAFF = 'STAFF',
    SHIPPER = 'SHIPPER',
    USER = 'USER',
}

export enum RoleScope {
  GLOBAL = "GLOBAL",
  FRANCHISE = "FRANCHISE",
}

export enum BaseField {
    ID = 'id',
    IS_ACTIVE = 'is_active',
    CREATED_AT = 'created_at',
    UPDATED_AT = 'updated_at',
    IS_DELETED = 'is_deleted',
}

export enum BaseGroup {
    SYSTEM = 'system',
    GROUP_01 = 'group_01',
    GROUP_02 = 'group_02',
    GROUP_03 = 'group_03',
    GROUP_04 = 'group_04',
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
}