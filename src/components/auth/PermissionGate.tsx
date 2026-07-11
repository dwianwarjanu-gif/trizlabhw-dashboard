import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

type Props = {
  permission?: string;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
  children: ReactNode;
};

const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  ADMIN: ["*"],
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
    "analytics.view",
    "settings.view",
    "marketplaces.view",
    "marketplaces.connect",
    "marketplaces.update",
    "marketplaces.disconnect",
    "marketplaces.test_connection",
    "marketplaces.sync",
    "marketplaces.rules.view",
    "marketplaces.rules.manage",
  ],
  STAFF: [
    "dashboard.view",
    "products.view",
    "products.create",
    "products.update",
    "orders.view",
    "orders.detail",
    "orders.update",
    "inventory.view",
    "inventory.update",
    "marketplaces.view",
    "marketplaces.test_connection",
    "marketplaces.sync",
  ],
  VIEWER: [
    "dashboard.view",
    "products.view",
    "orders.view",
    "orders.detail",
    "inventory.view",
    "marketplaces.view",
  ],
};

export default function PermissionGate({
  permission = "",
  fallback = null,
  loadingFallback = null,
  children,
}: Props) {
  const { user, permissions, isLoading } = useAuth();

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const storedPermissions = (() => {
    try {
      return JSON.parse(localStorage.getItem("permissions") || "[]");
    } catch {
      return [];
    }
  })();

  const role = String(user?.role || storedUser?.role || "")
    .trim()
    .toUpperCase();

  const isAdmin = role === "ADMIN";

  const rolePermissions = ROLE_PERMISSION_MAP[role] || [];

  const effectivePermissions = Array.from(
    new Set([
      ...(permissions || []),
      ...(storedPermissions || []),
      ...rolePermissions,
    ])
  );

  const normalizedPermission = String(permission || "").trim();

  const allowed =
    isAdmin ||
    effectivePermissions.includes("*") ||
    !normalizedPermission ||
    effectivePermissions.includes(normalizedPermission);

  if (isLoading && !user && !storedUser?.role) {
    return (
      <>
        {loadingFallback || (
          <div className="flex items-center justify-center py-8 text-sm text-zinc-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Memuat akses...
          </div>
        )}
      </>
    );
  }

  return allowed ? <>{children}</> : <>{fallback}</>;
}