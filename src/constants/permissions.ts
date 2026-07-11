export const PERMISSIONS = {
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_UPDATE: 'products.update',
  PRODUCTS_DELETE: 'products.delete',

  ORDERS_VIEW: 'orders.view',
  ORDERS_UPDATE: 'orders.update',

  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_UPDATE: 'inventory.update',
  RETURNS_VIEW: "returns.view",
  RETURNS_CREATE: "returns.create",
  RETURNS_APPROVE: "returns.approve",
  RETURNS_REJECT: "returns.reject",
  RETURNS_COMPLETE: "returns.complete",
  RETURNS_EXPORT: "returns.export",

  MARKETPLACE_VIEW: 'marketplace.view',
  MARKETPLACE_CONNECT: 'marketplace.connect',

  REPORTS_VIEW: 'reports.view',

  SETTINGS_VIEW: 'settings.view',
  SETTINGS_UPDATE: 'settings.update',

  ROLE_VIEW: 'roles.view',
  ROLE_UPDATE: 'roles.update',
} as const