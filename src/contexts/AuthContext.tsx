import { hasPermission as roleHasPermission, type Permission } from "@/config/permissions";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { authApi } from "@/services/api";
import { User, LoginCredentials, RegisterData } from "@/types/auth";

type AuthUser = User & {
  id?: string;
  user_id?: string;
  role?: string;
  permissions?: string[];
  tenant?: string;
};

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  tenant: string | null;
  permissions: string[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const STORAGE_KEYS = {
  token: "token",
  user: "user",
  permissions: "permissions",
  tenant: "tenant",
} as const;

const MARKETPLACE_PERMISSIONS = [
  "marketplaces.view",
  "marketplaces.connect",
  "marketplaces.update",
  "marketplaces.disconnect",
  "marketplaces.test_connection",
  "marketplaces.sync",
  "marketplaces.rules.view",
  "marketplaces.rules.manage",
];

const ROLE_PERMISSION_MAP: Record<string, string[]> = {
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
    ...MARKETPLACE_PERMISSIONS,
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
  "returns.view",
  "returns.create",
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
    "returns.view",
    "marketplaces.view",
  ],
};

function safeParse<T>(value: string | null): T | null {
  if (!value || value === "undefined" || value === "null") return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function normalizeRole(value: unknown): string {
  return String(value ?? "").trim().toUpperCase();
}

function normalizePermissions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(value.map((item) => String(item).trim()).filter(Boolean))
  );
}

function inferPermissionsFromRole(
  role: unknown,
  fallback: unknown = []
): string[] {
  const roleKey = normalizeRole(role);
  const rolePermissions = ROLE_PERMISSION_MAP[roleKey] || [];
  const fallbackPermissions = Array.isArray(fallback) ? fallback : [];
  return normalizePermissions([...rolePermissions, ...fallbackPermissions]);
}

function getTenantFromHost(): string {
  if (typeof window === "undefined") return "tokoa";

  const savedTenant = localStorage.getItem(STORAGE_KEYS.tenant);
  if (savedTenant) return savedTenant;

  const host = window.location.hostname.toLowerCase();

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "trizlabhw.com" ||
    host === "www.trizlabhw.com"
  ) {
    return "tokoa";
  }

  const parts = host.split(".");
  const subdomain = parts[0];

  if (!subdomain || subdomain === "www" || subdomain === "api") {
    return "tokoa";
  }

  return subdomain;
}

function extractAuthResponse(raw: any) {
  if (!raw || typeof raw !== "object") return {};
  const responseData = raw.data?.data ?? raw.data ?? raw;
  return responseData && typeof responseData === "object" ? responseData : {};
}

function sanitizeUserCandidate(raw: any): any {
  if (!raw || typeof raw !== "object") return null;

  const candidate = raw.user ?? raw.profile ?? raw.account ?? raw.data ?? raw;
  if (!candidate || typeof candidate !== "object") return null;

  const {
    token: _token,
    accessToken: _accessToken,
    refreshToken: _refreshToken,
    expiresIn: _expiresIn,
    ...rest
  } = candidate;

  return rest;
}

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    if (typeof window === "undefined") return null;

    const parts = token.split(".");
    if (parts.length < 2) return null;

    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const json = window.atob(padded);

    return JSON.parse(json);
  } catch {
    return null;
  }
}

function normalizeUser(payload: any): AuthUser | null {
  if (!payload || typeof payload !== "object") return null;

  const role = normalizeRole(
    payload.role ?? payload.role_key ?? payload.roleName ?? payload.role_name
  );

  const permissions = inferPermissionsFromRole(
    role,
    payload.permissions || payload.permission || []
  );

  return {
    ...payload,
    role,
    permissions,
  };
}

function inferUserFromToken(
  token: string,
  tenantFallback: string
): AuthUser | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const role = normalizeRole(
    payload.role ?? payload.role_key ?? payload.roleName ?? payload.role_name
  );
  const permissions = inferPermissionsFromRole(role, []);

  return {
    id: payload.id ?? payload.user_id ?? payload.userId ?? "",
    user_id: payload.user_id ?? payload.userId ?? payload.id ?? "",
    name:
      payload.name ??
      payload.fullName ??
      payload.username ??
      payload.email ??
      "",
    email: payload.email ?? "",
    role,
    tenant: payload.tenant ?? tenantFallback,
    permissions,
  } as AuthUser;
}

function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.token);
}

function readStoredTenant(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.tenant);
}

function readStoredPermissions(): string[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParse<string[]>(
    localStorage.getItem(STORAGE_KEYS.permissions)
  );
  return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
}

function mergeSession(
  token: string | null,
  user: AuthUser | null,
  storedPermissions: string[],
  tenantFallback: string
): { user: AuthUser | null; permissions: string[] } {
  const tokenUser = token ? inferUserFromToken(token, tenantFallback) : null;
  const mergedUser = user || tokenUser;

  const role = normalizeRole(mergedUser?.role || tokenUser?.role);
  const permissions = inferPermissionsFromRole(role, [
    ...(mergedUser?.permissions || []),
    ...storedPermissions,
  ]);

  if (!mergedUser && !tokenUser) {
    return {
      user: null,
      permissions,
    };
  }

  return {
    user: {
      ...(mergedUser || tokenUser)!,
      role,
      tenant: (mergedUser || tokenUser)?.tenant || tenantFallback,
      permissions,
    },
    permissions,
  };
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();

  const [token, setToken] = useState<string | null>(() => readStoredToken());
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = safeParse<AuthUser>(
      typeof window === "undefined" ? null : localStorage.getItem(STORAGE_KEYS.user)
    );
    if (!stored || typeof stored !== "object") return null;

    const role = normalizeRole((stored as any).role);
    const permissions = inferPermissionsFromRole(
      role,
      Array.isArray(stored.permissions) ? stored.permissions : []
    );

    return {
      ...stored,
      role,
      permissions,
    };
  });

  const [permissions, setPermissions] = useState<string[]>(() =>
    readStoredPermissions()
  );
  const [tenant, setTenant] = useState<string | null>(() => {
    const fromStorage = readStoredTenant();
    return fromStorage || getTenantFromHost();
  });
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = Boolean(token);

  const hasPermission = (permission: string) => {
    const normalizedPermission = String(permission || "").trim();
    if (!normalizedPermission) return true;

    const normalizedRole = normalizeRole(user?.role);

    if (normalizedRole === "ADMIN") {
      return true;
    }

    return permissions.includes(normalizedPermission);
   };

  const forceClearAuth = () => {
    setToken(null);
    setUser(null);
    setPermissions([]);
    setTenant(getTenantFromHost());

    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.permissions);
    localStorage.removeItem(STORAGE_KEYS.tenant);
  };

  const persistAuth = (next: {
    token?: string | null;
    user?: AuthUser | null;
    permissions?: string[];
    tenant?: string | null;
  }) => {
    if (next.token !== undefined) {
      setToken(next.token);
      if (next.token) {
        localStorage.setItem(STORAGE_KEYS.token, next.token);
      } else {
        localStorage.removeItem(STORAGE_KEYS.token);
      }
    }

    if (next.user !== undefined) {
      setUser(next.user);
      if (next.user) {
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(next.user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.user);
      }
    }

    if (next.permissions !== undefined) {
      const normalized = normalizePermissions(next.permissions);
      setPermissions(normalized);
      localStorage.setItem(
        STORAGE_KEYS.permissions,
        JSON.stringify(normalized)
      );
    }

    if (next.tenant !== undefined) {
      setTenant(next.tenant);
      if (next.tenant) {
        localStorage.setItem(STORAGE_KEYS.tenant, next.tenant);
      } else {
        localStorage.removeItem(STORAGE_KEYS.tenant);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const resolvedTenant = getTenantFromHost();
        const storedToken = readStoredToken();
        const storedUser = safeParse<AuthUser>(
          typeof window === "undefined"
            ? null
            : localStorage.getItem(STORAGE_KEYS.user)
        );
        const storedPermissions = readStoredPermissions();

        setTenant(resolvedTenant);

        if (!storedToken) {
          forceClearAuth();
          return;
        }

        const tokenUser = inferUserFromToken(storedToken, resolvedTenant);
        const seeded = mergeSession(
          storedToken,
          storedUser || tokenUser,
          storedPermissions,
          resolvedTenant
        );

        if (seeded.user) setUser(seeded.user);
        if (seeded.permissions.length > 0) setPermissions(seeded.permissions);
        setToken(storedToken);

        try {
          const res = await authApi.getProfile();
          const responseData = extractAuthResponse(res);
          const rawUser = sanitizeUserCandidate(responseData);
          const payloadUser = normalizeUser(rawUser);

          const payloadPermissions = inferPermissionsFromRole(
            payloadUser?.role ?? responseData?.role ?? seeded.user?.role,
            responseData?.permissions ||
              payloadUser?.permissions ||
              seeded.permissions ||
              []
          );

          if (!mounted) return;

          if (payloadUser) {
            const mergedUser: AuthUser = {
              ...payloadUser,
              role: normalizeRole(
                payloadUser.role || responseData?.role || tokenUser?.role
              ),
              permissions: payloadPermissions,
              tenant: payloadUser.tenant || resolvedTenant,
            };

            persistAuth({
              token: storedToken,
              user: mergedUser,
              permissions: payloadPermissions,
              tenant: mergedUser.tenant,
            });
          } else {
            const fallback = mergeSession(
              storedToken,
              seeded.user,
              seeded.permissions,
              resolvedTenant
            );

            persistAuth({
              token: storedToken,
              user: fallback.user,
              permissions: fallback.permissions,
              tenant: fallback.user?.tenant || resolvedTenant,
            });
          }
        } catch (err: any) {
          const status = err?.response?.status;

          if (status === 401 || status === 403) {
            forceClearAuth();
            navigate("/login", { replace: true });
            return;
          }

          // Jangan logout kalau /me error non-auth.
          // Pakai session dari token/localStorage saja.
          const fallback = mergeSession(
            storedToken,
            seeded.user,
            seeded.permissions,
            resolvedTenant
          );

          persistAuth({
            token: storedToken,
            user: fallback.user,
            permissions: fallback.permissions,
            tenant: fallback.user?.tenant || resolvedTenant,
          });

          return;
        } 
        } catch (err) {
          console.error("INIT AUTH ERROR:", err);
          forceClearAuth();
        } finally {
          if (mounted) {
            setIsLoading(false);
           }
        }
      };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);

      const resolvedTenant = getTenantFromHost();

      const payload: LoginCredentials & { tenant: string } = {
        ...credentials,
        tenant: resolvedTenant,
      };

      const res = await authApi.login(payload);
      const responseData = extractAuthResponse(res);

      const nextToken =
        responseData.token || responseData.accessToken || res.data?.token || null;

      if (!nextToken) {
        throw new Error("Token missing from login response");
      }

      const rawUser = sanitizeUserCandidate(responseData);
      const nextUser = normalizeUser(rawUser);

      const nextPermissions = inferPermissionsFromRole(
        nextUser?.role ?? responseData?.role,
        responseData?.permissions || nextUser?.permissions || []
      );

      const tokenUser = inferUserFromToken(nextToken, resolvedTenant);
      const finalUser: AuthUser | null = nextUser
        ? {
            ...nextUser,
            role: normalizeRole(nextUser.role || tokenUser?.role),
            permissions: nextPermissions,
            tenant: nextUser.tenant || resolvedTenant,
          }
        : tokenUser;

      persistAuth({
        token: nextToken,
        user: finalUser,
        permissions: finalUser?.permissions || nextPermissions,
        tenant: finalUser?.tenant || resolvedTenant,
      });

      toast.success("Login berhasil");
      navigate("/dashboard");
    } catch (error: any) {
      console.log("LOGIN ERROR:", error);
      toast.error(error?.response?.data?.error || "Login gagal");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);

      const resolvedTenant = getTenantFromHost();

      const payload: RegisterData & { tenant: string } = {
        ...data,
        tenant: resolvedTenant,
      };

      const res = await authApi.register(payload);
      const responseData = extractAuthResponse(res);

      const nextToken =
        responseData.token || responseData.accessToken || res.data?.token || null;

      const rawUser = sanitizeUserCandidate(responseData);
      const nextUser = normalizeUser(rawUser);

      const nextPermissions = inferPermissionsFromRole(
        nextUser?.role ?? responseData?.role,
        responseData?.permissions || nextUser?.permissions || []
      );

      const finalUser: AuthUser | null = nextUser
        ? {
            ...nextUser,
            role: normalizeRole(nextUser.role),
            permissions: nextPermissions,
            tenant: nextUser.tenant || resolvedTenant,
          }
        : nextToken
        ? inferUserFromToken(nextToken, resolvedTenant)
        : null;

      if (nextToken) {
        persistAuth({
          token: nextToken,
          user: finalUser,
          permissions: finalUser?.permissions || nextPermissions,
          tenant: finalUser?.tenant || resolvedTenant,
        });
        toast.success("Registrasi berhasil");
        navigate("/dashboard");
      } else {
        persistAuth({
          user: finalUser,
          permissions: finalUser?.permissions || nextPermissions,
          tenant: resolvedTenant,
        });
        toast.success("Registrasi berhasil! Silakan login.");
        navigate("/login");
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Registrasi gagal";

      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await authApi.logout().catch(() => {});
      }
    } finally {
      forceClearAuth();
      toast.success("Logout berhasil");
      navigate("/login");
    }
  };

  const refreshToken = async () => {
    try {
      const currentToken = readStoredToken();

      if (!currentToken) {
        forceClearAuth();
        throw new Error("No token available to refresh");
      }

      const res = await authApi.refreshToken();
      const responseData = extractAuthResponse(res);

      const newToken =
        responseData.token || responseData.accessToken || res.data?.token || null;

      if (!newToken) {
        throw new Error("Token missing from refresh response");
      }

      const resolvedTenant = tenant || getTenantFromHost();
      const tokenUser = inferUserFromToken(newToken, resolvedTenant);

      const merged = mergeSession(
        newToken,
        tokenUser || user,
        permissions,
        resolvedTenant
      );

      persistAuth({
        token: newToken,
        user: merged.user,
        permissions: merged.permissions,
        tenant: merged.user?.tenant || resolvedTenant,
      });
    } catch (error) {
      console.error("Token refresh failed:", error);
      forceClearAuth();
      throw error;
    }
  };

  const value: AuthContextType = useMemo(
    () => ({
      user,
      token,
      tenant,
      permissions,
      isLoading,
      isAuthenticated,
      login,
      register,
      logout,
      refreshToken,
      hasPermission,
    }),
    [user, token, tenant, permissions, isLoading, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};