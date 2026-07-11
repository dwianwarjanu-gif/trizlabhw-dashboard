import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

type Props = {
  permission?: string;
  anyOf?: string[];
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
  hideWhileLoading?: boolean;
};

export default function Can({
  permission,
  anyOf,
  children,
  fallback = null,
  loadingFallback = null,
  hideWhileLoading = true,
}: Props) {
  const { user, permissions, isLoading, isAuthenticated } = useAuth();

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

  const effectivePermissions =
    permissions && permissions.length > 0 ? permissions : storedPermissions;

  if (isLoading && !user && !storedUser?.role) {
    if (loadingFallback) return <>{loadingFallback}</>;
    if (hideWhileLoading) return null;
    return <>{fallback}</>;
  }

  if (!isAuthenticated && !localStorage.getItem("token")) {
    return <>{fallback}</>;
  }

  const allowed = isAdmin
    ? true
    : permission
      ? effectivePermissions.includes(permission)
      : Array.isArray(anyOf) && anyOf.length > 0
        ? anyOf.some((item) => effectivePermissions.includes(item))
        : true;

  return allowed ? <>{children}</> : <>{fallback}</>;
}