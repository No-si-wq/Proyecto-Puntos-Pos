import { Role } from "../types/user";

export type PermissionAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "export"
  | "manage";

export type PermissionModule =
  | "dashboard"
  | "users"
  | "customers"
  | "products"
  | "inventory"
  | "purchases"
  | "sales"
  | "suppliers"
  | "purchasesreport"
  | "category"
  | "purchasehistory"
  | "salehistory"
  | "warehouse"
  | "dashboard_admin"
  | "accountsReceivable"
  | "accountPayable"

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
    delete: [Role.ADMIN],
  },

  inventory: {
    view: [Role.ADMIN, Role.USER],
  },

  purchases: {
    view: [Role.ADMIN, Role.USER],
    create: [Role.ADMIN, Role.USER],
  },

  sales: {
    view: [Role.ADMIN, Role.USER],
    create: [Role.ADMIN, Role.USER],
    delete: [Role.ADMIN],
    export: [Role.ADMIN],
  },

  suppliers: {
    view: [Role.ADMIN, Role.USER],
    create: [Role.ADMIN, Role.USER],
    edit: [Role.ADMIN],
  },

  purchasesreport: {
    view: [Role.ADMIN, Role.USER]
  },

  category: {
    view: [Role.ADMIN, Role.USER],
    create: [Role.ADMIN, Role.USER],
    edit: [Role.ADMIN],
    delete: [Role.ADMIN],
  },

  purchasehistory: {
    view: [Role.ADMIN, Role.USER]
  },

  salehistory: {
    view: [Role.ADMIN, Role.USER]
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
  }
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