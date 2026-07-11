import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import {
  hasPermission as roleHasPermission,
  type Permission,
} from "@/config/permissions";

type Props = {
  permission: string;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
  children: ReactNode;
};

export default function PermissionGate({
  permission,
  fallback = null,
  loadingFallback = null,
  children,
}: Props) {
  const { user, permissions, isLoading, isAuthenticated, hasPermission } =
    useAuth();

  if (isLoading) {
    if (loadingFallback) return <>{loadingFallback}</>;

    return (
      <div className="flex items-center justify-center py-8 text-sm text-zinc-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Memuat akses...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  const normalizedPermission = String(permission || "").trim();
  if (!normalizedPermission) {
    return <>{children}</>;
  }

  const typedPermission = normalizedPermission as Permission;
  const directAllowed = hasPermission(normalizedPermission);
  const roleAllowed = roleHasPermission(user?.role, typedPermission);
  const storedAllowed = permissions.includes(normalizedPermission);

  if (directAllowed || roleAllowed || storedAllowed) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}