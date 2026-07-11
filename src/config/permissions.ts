export type Role = "ADMIN" | "MANAGER" | "STAFF" | "VIEWER";

export type Permission =
  | "dashboard.view"
  | "products.view"
  | "products.create"
  | "products.update"
  | "products.delete"
  | "orders.view"
  | "orders.detail"
  | "orders.update"
  | "inventory.view"
  | "inventory.update"
  | "returns.view"
  | "returns.create"
  | "returns.approve"
  | "returns.reject"
  | "returns.complete"
  | "returns.export"
  | "analytics.view"
  | "settings.view"
  | "roles.manage"
  | "marketplaces.view"
  | "marketplaces.connect"
  | "marketplaces.update"
  | "marketplaces.disconnect"
  | "marketplaces.test_connection"
  | "marketplaces.sync"
  | "marketplaces.rules.view"
  | "marketplaces.rules.manage";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    "dashboard.view",
    "products.view",
    "products.create",
    "products.update",
    "products.delete",
    "orders.view",
    "orders.detail",
    "orders.update",
    "inventory.view",
    "inventory.update",
    "returns.view",
    "returns.create",
    "returns.approve",
    "returns.reject",
    "returns.complete",
    "returns.export",
    "analytics.view",
    "settings.view",
    "roles.manage",
    "marketplaces.view",
    "marketplaces.connect",
    "marketplaces.update",
    "marketplaces.disconnect",
    "marketplaces.test_connection",
    "marketplaces.sync",
    "marketplaces.rules.view",
    "marketplaces.rules.manage",
  ],
  MANAGER: [
    "dashboard.view",
    "products.view",
    "products.create",
    "products.update",
    "orders.view",
    "orders.detail",
    "orders.update",
    "inventory.view",
    "inventory.update",
    "returns.view",
    "returns.create",
    "returns.approve",
    "returns.reject",
    "returns.complete",
    "returns.export",
    "analytics.view",
    "settings.view",
    "marketplaces.view",
    "marketplaces.connect",
    "marketplaces.update",
    "marketplaces.test_connection",
    "marketplaces.sync",
    "marketplaces.rules.view",
    "marketplaces.rules.manage",
  ],
  STAFF: [
    "dashboard.view",
    "products.view",
    "products.update",
    "orders.view",
    "orders.detail",
    "inventory.view",
    "inventory.update",
    "returns.view",
    "returns.create",
    "marketplaces.view",
    "marketplaces.sync",
    "marketplaces.rules.view",
  ],
  VIEWER: [
    "dashboard.view",
    "products.view",
    "orders.view",
    "orders.detail",
    "inventory.view",
    "returns.view",
    "marketplaces.view",
  ],
};

export function normalizeRole(role?: string | null): Role | undefined {
  const value = String(role || "").toUpperCase();
  if (value in ROLE_PERMISSIONS) return value as Role;
  return undefined;
}

export function hasPermission(
  role?: string | null,
  permission?: Permission
): boolean {
  if (!permission) return true;

  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) return false;

  return ROLE_PERMISSIONS[normalizedRole].includes(permission);
}

export function hasAnyPermission(
  role?: string | null,
  permissions: Permission[] = []
): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const json = atob(padded);

    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getStoredRole(): Role | undefined {
  if (typeof window === "undefined") return undefined;

  const userKeys = ["user", "authUser", "profile", "currentUser"];
  for (const key of userKeys) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      const role = parsed?.role ?? parsed?.user?.role ?? parsed?.data?.role;
      const normalized = normalizeRole(role);
      if (normalized) return normalized;
    } catch {
      // ignore
    }
  }

  const tokenKeys = ["accessToken", "token", "authToken"];
  for (const key of tokenKeys) {
    const token = window.localStorage.getItem(key);
    if (!token) continue;

    const payload = decodeJwtPayload(token);
    const role = payload?.role ?? payload?.user?.role;
    const normalized = normalizeRole(role as string | null | undefined);
    if (normalized) return normalized;
  }

  return undefined;
}

export function isAllowed(
  role?: string | null,
  permission?: Permission
): boolean {
  return hasPermission(role, permission);
}