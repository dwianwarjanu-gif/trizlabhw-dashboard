import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bars3Icon,
  XMarkIcon,
  Squares2X2Icon,
  CubeIcon,
  ShoppingBagIcon,
  ArchiveBoxIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ArrowPathIcon,
  UserCircleIcon,
  ChevronDownIcon,
  ComputerDesktopIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";

import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/notifications/NotificationBell";
import { cn } from "@/utils/cn";
import { authApi, tenantApi } from "@/services/api";
import toast from "react-hot-toast";

type NavItem = {
  name: string;
  href?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  permission?: string;
  children?: NavItem[];
};

type TenantBranding = {
  tenant: string;
  appName: string;
  sidebarTitle: string;
  sidebarSubtitle: string;
  logoUrl: string | null;
  primaryColor: string;
};

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: Squares2X2Icon, permission: "dashboard.view" },
  { name: "Product", href: "/products", icon: CubeIcon, permission: "products.view" },
  { name: "Order", href: "/orders", icon: ShoppingBagIcon, permission: "orders.view" },
  { name: "Stock Center", href: "/inventory", icon: ArchiveBoxIcon, permission: "inventory.view" },
  { name: "Marketplace", href: "/marketplaces", icon: BuildingStorefrontIcon, permission: "marketplaces.view",
    children: [
      { name: "Account Marketplace", href: "/marketplaces", icon: BuildingStorefrontIcon, permission: "marketplaces.view" },
      { name: "Category Mapping", href: "/marketplaces/category-mappings", icon: BuildingStorefrontIcon, permission: "marketplaces.view" },
      { name: "Stock Sync Center", href: "/stock-sync/center", icon: ArrowPathIcon, permission: "marketplaces.sync" },
      { name: "Stock Sync Logs", href: "/stock-sync/logs", icon: ArrowPathIcon, permission: "marketplaces.sync" },
    ],
  }, 
  { name: "Analytics", href: "/analytics", icon: ChartBarIcon, permission: "analytics.view" },
  { name: "Settings", href: "/settings", icon: Cog6ToothIcon, permission: "settings.view",
    children: [
      { name: "General Settings", href: "/settings", icon: Cog6ToothIcon, permission: "settings.view" },
      { name: "Profile", href: "/settings/profile", icon: UserCircleIcon, permission: "settings.view" },
      { name: "Sessions", href: "/settings/sessions", icon: ComputerDesktopIcon, permission: "settings.view" },
      { name: "Notifications", href: "/settings/notifications", icon: BellIcon, permission: "settings.view" },
      { name: "Users", href: "/settings/users", icon: UserGroupIcon, permission: "users.view" },
      { name: "Role Permission", href: "/settings/roles", icon: ShieldCheckIcon, permission: "roles.manage" },
      { name: "Audit Logs", href: "/settings/audit-logs", icon: DocumentTextIcon, permission: "audit_logs.view" },
    ],
  },
];

function isActivePath(pathname: string, href?: string) {
  if (!href) return false;
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({Marketplace: true});
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, permissions, tenant } = useAuth();
  
const [branding, setBranding] = useState<TenantBranding>({
  tenant: localStorage.getItem("tenant") || "tokoa",
  appName: "Tokoa TRIZLABHW",
  sidebarTitle: "Tokoa",
  sidebarSubtitle: "TRIZLABHW",
  logoUrl: null,
  primaryColor: "#2563eb",
});

const brandStyle = useMemo(
  () => ({
    "--tenant-primary": branding.primaryColor || "#2563eb",
  }) as React.CSSProperties,
  [branding.primaryColor]
);

useEffect(() => {
  let mounted = true;

  tenantApi
    .getBranding()
    .then((res) => {
      if (!mounted) return;

      const payload = res.data?.branding;
      const tenant = res.data?.tenant;

      if (payload) {
        setBranding({
          tenant: tenant || localStorage.getItem("tenant") || "tokoa",
          appName: payload.appName || "Tokoa TRIZLABHW",
          sidebarTitle: payload.sidebarTitle || "Tokoa",
          sidebarSubtitle: payload.sidebarSubtitle || "TRIZLABHW",
          logoUrl: payload.logoUrl || null,
          primaryColor: payload.primaryColor || "#2563eb",
        });

        document.title = payload.appName || "Marketplace Integration";
      }
    })
    .catch(() => {
      // fallback branding tetap dipakai
    });

  return () => {
    mounted = false;
  };
}, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

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
    
  const displayName =
    user?.name ||
    storedUser?.name ||
    user?.email ||
    storedUser?.email ||
    "User";

  const displayEmail =
    user?.email ||
    storedUser?.email ||
    "-";

  const displayTenant =
    tenant ||
    user?.tenant ||
    storedUser?.tenant ||
    localStorage.getItem("tenant") ||
    "tokoa";

  const rolePermissions: Record<string, string[]> = {
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

  const effectivePermissions = Array.from(
    new Set([
      ...(permissions || []),
      ...(storedPermissions || []),
      ...(rolePermissions[role] || []),
    ])
  );

  const canAccess = (permission?: string) => {
    if (!permission) return true;
    if (effectivePermissions.includes("*")) return true;
    return effectivePermissions.includes(permission);
  };

  const handleChangePassword = async () => {
      try {
        if (!passwordForm.currentPassword || !passwordForm.newPassword) {
          toast.error("Password lama dan baru wajib diisi");
            return;
          }

          if (passwordForm.newPassword.length < 6) {
            toast.error("Password baru minimal 6 karakter");
            return;
         }

          setChangePasswordLoading(true);

          await authApi.changePassword({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
          });

          toast.success("Password berhasil diubah");
            setPasswordForm({ currentPassword: "", newPassword: "" });
            setChangePasswordOpen(false);
        } catch (err: any) {
          toast.error(err?.response?.data?.message || "Gagal mengubah password");
        } finally {
          setChangePasswordLoading(false);
      }
  };

  const renderNav = (mobile = false) => (
    <div className="space-y-1">
      {navItems
        .filter((item) => canAccess(item.permission))
        .map((item) => {
          const Icon = item.icon;
          const hasChildren = Boolean(item.children?.length);
          const childActive = item.children?.some((child) =>
            isActivePath(location.pathname, child.href)
          );
          const active = isActivePath(location.pathname, item.href) || Boolean(childActive);
          const isOpen = Boolean(openMenus[item.name] || childActive);

          return (
            <div key={item.name}>
              <button
                type="button"
                onClick={() => {
                  if (hasChildren) {
                    setOpenMenus((prev) => ({
                      ...prev,
                      [item.name]: !prev[item.name],
                    }));
                    return;
                  }

                  if (item.href) navigate(item.href);
                  if (mobile) setSidebarOpen(false);
                }}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  active
                    ? "bg-[color:var(--tenant-primary)/0.08] text-[color:var(--tenant-primary)]"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    active ? "text-[color:var(--tenant-primary)]" : "text-slate-500"
                  )}
                />

                {!sidebarCollapsed && <span className="flex-1">{item.name}</span>}

                {!sidebarCollapsed && (
                  <ChevronRightIcon
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isOpen && hasChildren ? "rotate-90" : "",
                      active ? "text-blue-700" : "text-slate-400"
                    )}
                  />
                )}
              </button>

              {hasChildren && isOpen && !sidebarCollapsed && (
                <div className="mt-1 space-y-1 pl-8">
                  {item.children
                    ?.filter((child) => canAccess(child.permission))
                    .map((child) => {
                      const childActive = isActivePath(location.pathname, child.href);

                      return (
                        <button
                          key={child.href}
                          type="button"
                          onClick={() => {
                            if (child.href) navigate(child.href);
                            if (mobile) setSidebarOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors",
                            childActive
                              ? "bg-blue-50 text-blue-700"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          )}
                        >
                          {child.name}
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900"
      style={brandStyle}
    >
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 md:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
            <div>
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={branding.appName}
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <>
                  <div className="text-lg font-bold leading-tight text-slate-900">
                  {branding.sidebarTitle}
              </div>

            <div className="text-sm text-slate-500">
        {branding.sidebarSubtitle}
      </div>
    </>
  )}
</div>

          <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-100"
              aria-label="Tutup sidebar"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {renderNav(true)}
          </nav>
        </div>
      </aside>

{/* Desktop sidebar */}
<aside
  className={cn(
    "fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200 bg-white transition-all duration-300 md:flex md:flex-col",
    sidebarCollapsed ? "w-20" : "w-64"
  )}
>
  <div className="border-b border-slate-200 px-4 py-4">
    <div className="flex items-start justify-between gap-3">
      {!sidebarCollapsed && (
        <div>
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={branding.appName}
              className="h-12 w-auto object-contain"
            />
          ) : (
            <>
              <div className="text-2xl font-bold leading-tight text-slate-900">
                {branding.sidebarTitle}
              </div>

              <div className="text-lg font-semibold leading-tight text-slate-900">
                {branding.sidebarSubtitle}
              </div>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setSidebarCollapsed((prev) => !prev)}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100"
        aria-label={sidebarCollapsed ? "Buka sidebar" : "Tutup sidebar"}
      >
        <Bars3Icon className="h-5 w-5" />
      </button>
    </div>
  </div>
   <nav className="flex-1 overflow-y-auto px-3 py-4">
     {renderNav(false)}
   </nav>
 </aside>

{/* Main content */}
 <div className={cn("min-w-0 overflow-x-hidden transition-all duration-300", sidebarCollapsed ? "md:pl-20" : "md:pl-64")}>
  <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
    <div className="flex h-16 min-w-0 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100 md:hidden"
          aria-label="Buka sidebar"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        <div className="hidden truncate text-sm font-medium text-slate-500 sm:block">
          {branding.appName}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <NotificationBell />

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          <BuildingStorefrontIcon className="h-5 w-5 shrink-0" />
          <span className="hidden sm:inline">Marketplace</span>
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <UserCircleIcon className="h-5 w-5 shrink-0" />
            <span className="hidden max-w-[160px] truncate sm:inline">
              {displayName}
            </span>
              <ChevronDownIcon className="h-4 w-4 shrink-0" />
            </button>

          {userMenuOpen && (
            <div className="absolute right-0 z-50 mt-3 w-72 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
              <div className="border-b border-slate-200 px-4 py-4">
                <div className="font-semibold text-slate-900">
                  {displayName}
                </div>
                <div className="mt-1 truncate text-sm text-slate-500">
                  {displayEmail}
                </div>
                <div className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {role || "USER"} • {displayTenant}
                </div>
              </div>

            <div className="p-2">
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  navigate("/settings/profile");
                }}
                  className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                >
                  <UserCircleIcon className="h-4 w-4" />
                  Profile
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    setChangePasswordOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                >
                  <KeyIcon className="h-4 w-4" />
                  Change Password
                </button>

                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </header>
  <main className="min-h-[calc(100vh-4rem)] min-w-0 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
    <div className="mx-auto min-w-0 max-w-7xl">
      <Outlet />
    </div>
  </main>
             
{changePasswordOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Change Password
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Ubah password akun {displayEmail}
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">
            Password Lama
          </label>
          <input
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({
                ...prev,
                currentPassword: e.target.value,
              }))
            }
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
            placeholder="Masukkan password lama"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Password Baru
          </label>
          <input
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({
                ...prev,
                newPassword: e.target.value,
              }))
            }
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
            placeholder="Minimal 6 karakter"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            setChangePasswordOpen(false);
            setPasswordForm({ currentPassword: "", newPassword: "" });
          }}
          className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Batal
        </button>

        <button
          type="button"
          onClick={handleChangePassword}
          disabled={changePasswordLoading}
          className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {changePasswordLoading ? "Menyimpan..." : "Simpan Password"}
        </button>
      </div>
    </div>
  </div>
)}
 </div>
</div>
  );
};

export default DashboardLayout;