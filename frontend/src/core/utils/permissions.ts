import { Role } from "../auth/roles";

export type PermissionAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "export"
  | "manage"
  | "cancel"
  | "devolution";

export type PermissionModule =
  | "dashboard"
  | "users"
  | "customers"
  | "products"
  | "inventory"
  | "purchases"
  | "sales"
  | "suppliers"
  | "category"
  | "warehouse"
  | "dashboard_admin"
  | "accountsReceivable"
  | "accountPayable"
  | "reports"
  | "priceList"
  | "commission"
  | "settings"
  | "remissions"
  | "quotations"

export const PERMISSIONS: Record<
  PermissionModule,
  Partial<Record<PermissionAction, Role[]>>
> = {
  dashboard: {
    view: [Role.USER],
  },

  dashboard_admin: {
    view: [Role.ADMIN]
  },

  users: {
    view: [Role.ADMIN],
    create: [Role.ADMIN],
    edit: [Role.ADMIN],
    delete: [Role.ADMIN],
    manage: [Role.ADMIN],
  },

  customers: {
    view: [Role.ADMIN, Role.USER],
    create: [Role.ADMIN, Role.USER],
    edit: [Role.ADMIN],
    delete: [Role.ADMIN],
  },

  products: {
    view: [Role.ADMIN, Role.USER],
    create: [Role.ADMIN, Role.USER],
    edit: [Role.ADMIN],
    manage: [Role.ADMIN],
    delete: [Role.ADMIN],
  },

  inventory: {
    view: [Role.ADMIN, Role.USER],
    export: [Role.ADMIN, Role.USER],
    manage: [Role.ADMIN],
  },

  purchases: {
    view: [Role.ADMIN, Role.USER],
    create: [Role.ADMIN, Role.USER],
  },

  sales: {
    view: [Role.ADMIN, Role.USER, Role.SELLER],
    create: [Role.ADMIN, Role.USER, Role.SELLER],
    cancel: [Role.ADMIN],
    devolution: [Role.ADMIN],
    export: [Role.ADMIN],
  },

  suppliers: {
    view: [Role.ADMIN, Role.USER],
    create: [Role.ADMIN, Role.USER],
    edit: [Role.ADMIN],
    delete: [Role.ADMIN],
  },

  category: {
    view: [Role.ADMIN, Role.USER],
    create: [Role.ADMIN, Role.USER],
    edit: [Role.ADMIN],
    delete: [Role.ADMIN],
  },

  warehouse: {
    view: [Role.ADMIN],
    create: [Role.ADMIN],
    edit: [Role.ADMIN],
    delete: [Role.ADMIN],
  },

  accountsReceivable: {
    view: [Role.ADMIN, Role.USER],
  },

  accountPayable: {
    view: [Role.ADMIN, Role.USER],
  },

  reports: {
    view: [Role.ADMIN]
  },

  priceList: {
    view: [Role.ADMIN, Role.USER],
    create: [Role.ADMIN, Role.USER],
    edit: [Role.ADMIN],
    delete: [Role.ADMIN]
  },

  commission: {
    view: [Role.ADMIN],
    create: [Role.ADMIN],
    edit: [Role.ADMIN],
    delete: [Role.ADMIN],
  },

  settings: {
    view: [Role.ADMIN],
  },

  remissions: {
    view: [Role.ADMIN, Role.USER]
  },

  quotations: {
    view: [Role.ADMIN, Role.USER]
  },

};

export function getAllowedRoles(
  module: PermissionModule,
  action: PermissionAction
): Role[] {
  return PERMISSIONS[module]?.[action] ?? [];
}

export function canAccess(
  role: Role,
  module: PermissionModule,
  action: PermissionAction = "view"
): boolean {
  const allowed = getAllowedRoles(module, action);
  return allowed.includes(role);
}