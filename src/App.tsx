import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

import AuthLayout from "@/components/layouts/AuthLayout";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import PermissionGate from "@/components/auth/PermissionGate";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";

import AICommandPalette from "@/components/ai/AICommandPalette";
import DashboardPage from "@/pages/DashboardPage";
import ProductsPage from "@/pages/ProductsPage";
import ProductDetailPage from "@/pages/products/ProductDetail";
import CreateProductPage from "@/pages/products/CreateProductPage";
import OrdersPage from "@/pages/orders/OrdersPage";
import OrderDetailPage from "@/pages/orders/OrderDetailPage";
import InventoryPage from "@/pages/inventory/InventoryPage";
import MarketplacesPage from "@/pages/marketplaces/MarketplacesPage";
import CategoryMappingsPage from "@/pages/marketplaces/CategoryMappingsPage";
import StockSyncCenterPage from "./pages/stock-sync/StockSyncCenterPage";
import StockSyncLogsPage from "./pages/stock-sync/StockSyncLogsPage";
import QueueMonitorPage from "./pages/queue/QueueMonitorPage";
import AnalyticsPage from "@/pages/analytics/AnalyticsPage";
import SettingsPage from "@/pages/settings/SettingsPage";
import RolePermissionsPage from "@/pages/settings/RolePermissionsPage";
import ProfilePage from "@/pages/settings/ProfilePage";
import UsersPage from "@/pages/settings/UsersPage";
import NotificationsPage from "@/pages/settings/NotificationsPage";
import AuditLogsPage from "@/pages/settings/AuditLogsPage";
import SessionManagementPage from "./pages/settings/SessionManagementPage";
import { syncTenantFromHost } from "@/utils/tenant";


const PERMISSIONS = {
  DASHBOARD: "dashboard.view",
  PRODUCTS_VIEW: "products.view",
  PRODUCTS_CREATE: "products.create",
  ORDERS_VIEW: "orders.view",
  ORDERS_DETAIL: "orders.detail",
  INVENTORY_VIEW: "inventory.view",
  ANALYTICS_VIEW: "analytics.view",
  SETTINGS_VIEW: "settings.view",
  USERS_VIEW: "users.view",
  PROFILE_VIEW: "settings.view",
  ROLES_MANAGE: "roles.manage",
  AUDIT_LOGS_VIEW: "audit_logs.view",
  MARKETPLACES_VIEW: "marketplaces.view",
  SYNC_CENTER_VIEW: "sync.view",
} as const;

function AppRoutes() {
  const { token, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <LoadingSpinner size="lg" text="Memuat aplikasi..." />
      </div>
    );
  }

  const accessDenied = (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">Akses ditolak</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Anda tidak memiliki izin untuk membuka halaman ini.
        </p>
      </div>
    </div>
  );

  const requirePermission = (permission: string, page: React.ReactNode) => (
    <PermissionGate permission={permission} fallback={accessDenied}>
      {page}
    </PermissionGate>
  );

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={token ? "/dashboard" : "/login"} replace />}
      />

      <Route
        element={token ? <Navigate to="/dashboard" replace /> : <AuthLayout />}
      >
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route
        element={!token || !isAuthenticated ? <Navigate to="/login" replace /> : <DashboardLayout />}
      >
        <Route path="/queue-monitor" element={<QueueMonitorPage />} />

        <Route
          path="/dashboard"
          element={requirePermission(PERMISSIONS.DASHBOARD, <DashboardPage />)}
        />

        <Route
          path="/products"
          element={requirePermission(PERMISSIONS.PRODUCTS_VIEW, <ProductsPage />)}
        />
        <Route
          path="/products/create"
          element={requirePermission(PERMISSIONS.PRODUCTS_CREATE, <CreateProductPage />)}
        />
        <Route
          path="/products/:id"
          element={requirePermission(PERMISSIONS.PRODUCTS_VIEW, <ProductDetailPage />)}
        />

        <Route
          path="/orders"
          element={requirePermission(PERMISSIONS.ORDERS_VIEW, <OrdersPage />)}
        />
        <Route
          path="/orders/:id"
          element={requirePermission(PERMISSIONS.ORDERS_DETAIL, <OrderDetailPage />)}
        />

        <Route
          path="/inventory"
          element={requirePermission(PERMISSIONS.INVENTORY_VIEW, <InventoryPage />)}
        />
        
        <Route
          path="/marketplace"
          element={requirePermission(PERMISSIONS.MARKETPLACES_VIEW, <MarketplacesPage />)}
        />
      
        <Route
          path="/marketplaces"
          element={requirePermission(PERMISSIONS.MARKETPLACES_VIEW, <MarketplacesPage />)}
        />

        <Route
          path="/marketplaces/category-mappings"
          element={requirePermission(PERMISSIONS.MARKETPLACES_VIEW, <CategoryMappingsPage />)}
        />

        <Route
          path="/stock-sync/center"
          element={requirePermission(PERMISSIONS.MARKETPLACES_SYNC, <StockSyncCenterPage />)}
        />

        <Route
          path="/stock-sync/logs"
          element={requirePermission(PERMISSIONS.MARKETPLACES_SYNC, <StockSyncLogsPage />)}
        />

        <Route 
          path="/sync-center"
          element={requirePermission(PERMISSIONS.MARKETPLACES_VIEW, <QueueMonitorPage />)} 
        />

        <Route
          path="/analytics"
          element={requirePermission(PERMISSIONS.ANALYTICS_VIEW, <AnalyticsPage />)}
        />

        <Route
          path="/settings"
          element={requirePermission(PERMISSIONS.SETTINGS_VIEW, <SettingsPage />)}
        />

        <Route
          path="/settings/users"
          element={requirePermission(PERMISSIONS.USERS_VIEW, <UsersPage />)}
        />

        <Route
          path="/settings/profile"
          element={requirePermission(PERMISSIONS.PROFILE_VIEW, <ProfilePage />)}
        />

        <Route
          path="/settings/roles"
          element={requirePermission(PERMISSIONS.ROLES_MANAGE, <RolePermissionsPage />)}
        />

        <Route
          path="/settings/audit-logs"
          element={requirePermission(PERMISSIONS.AUDIT_LOGS_VIEW, <AuditLogsPage />)}
        />

        <Route
          path="/settings/sessions"
          element={requirePermission(PERMISSIONS.Session_VIEW, <SessionManagementPage />)}
        />

        <Route
          path="/settings/notifications"
          element={requirePermission(PERMISSIONS.SETTINGS_VIEW, <NotificationsPage />)}
        />

        <Route
          path="/role-permission"
          element={requirePermission(PERMISSIONS.ROLES_MANAGE, <RolePermissionsPage />)}
        />
      </Route>

      <Route
        path="*"
        element={<Navigate to={token ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
  );
}

export default function App() {
  syncTenantFromHost();

  const [showCommandPalette, setShowCommandPalette] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isCommand =
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k";

      if (isCommand) {
        event.preventDefault();
        setShowCommandPalette(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <AppRoutes />

      <AICommandPalette
        open={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />
    </>
  );
}