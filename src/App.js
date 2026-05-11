import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
// Layout components
import AuthLayout from '@/components/layouts/AuthLayout';
import DashboardLayout from '@/components/layouts/DashboardLayout';
// Auth pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
// Dashboard pages
import DashboardPage from '@/pages/DashboardPage';
import ProductsPage from '@/pages/ProductsPage';
import ProductDetailPage from '@/pages/products/ProductDetail';
import CreateProductPage from '@/pages/products/CreateProductPage';
import OrdersPage from '@/pages/orders/OrdersPage';
import OrderDetailPage from '@/pages/orders/OrderDetailPage';
import InventoryPage from '@/pages/inventory/InventoryPage';
import MarketplacesPage from '@/pages/marketplaces/MarketplacesPage';
import AnalyticsPage from '@/pages/analytics/AnalyticsPage';
import SettingsPage from '@/pages/settings/SettingsPage';
// Loading component
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProtectedRoute from '@/components/ProtectedRoute';
import PublicRoute from '@/components/PublicRoute';
<Route
  path="/orders/:id"
  element={<OrderDetailPage />}
/>
function App() {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: isAuthenticated ? _jsx(Navigate, { to: "/dashboard", replace: true }) :
                    _jsx(AuthLayout, { children: _jsx(LoginPage, {}) }) }), _jsx(Route, { path: "/dashboard", element: _jsx(ProtectedRoute, { children: _jsx(DashboardPage, {}) }) }), _jsx(Route, { path: "/register", element: isAuthenticated ? _jsx(Navigate, { to: "/dashboard", replace: true }) :
                    _jsx(AuthLayout, { children: _jsx(RegisterPage, {}) }) }), _jsx(Route, { path: "/dashboard", element: _jsx(ProtectedRoute, { children: _jsx(DashboardPage, {}) }) }), _jsx(Route, { path: "/products", element: _jsx(ProductsPage, {}) }), _jsx(Route, { path: "/products/create", element: isAuthenticated ?
                    _jsx(DashboardLayout, { children: _jsx(CreateProductPage, {}) }) :
                    _jsx(Navigate, { to: "/login", replace: true }) }), _jsx(Route, { path: "/products/:id", element: isAuthenticated ?
                    _jsx(DashboardLayout, { children: _jsx(ProductDetailPage, {}) }) :
                    _jsx(Navigate, { to: "/login", replace: true }) }), _jsx(Route, { path: "/orders", element: isAuthenticated ?
                    _jsx(DashboardLayout, { children: _jsx(OrdersPage, {}) }) :
                    _jsx(Navigate, { to: "/login", replace: true }) }), _jsx(Route, { path: "/orders/:id", element: isAuthenticated ?
                    _jsx(DashboardLayout, { children: _jsx(OrderDetailPage, {}) }) :
                    _jsx(Navigate, { to: "/login", replace: true }) }), _jsx(Route, { path: "/inventory", element: isAuthenticated ?
                    _jsx(DashboardLayout, { children: _jsx(InventoryPage, {}) }) :
                    _jsx(Navigate, { to: "/login", replace: true }) }), _jsx(Route, { path: "/marketplaces", element: isAuthenticated ?
                    _jsx(DashboardLayout, { children: _jsx(MarketplacesPage, {}) }) :
                    _jsx(Navigate, { to: "/login", replace: true }) }), _jsx(Route, { path: "/analytics", element: isAuthenticated ?
                    _jsx(DashboardLayout, { children: _jsx(AnalyticsPage, {}) }) :
                    _jsx(Navigate, { to: "/login", replace: true }) }), _jsx(Route, { path: "/settings", element: isAuthenticated ?
                    _jsx(DashboardLayout, { children: _jsx(SettingsPage, {}) }) :
                    _jsx(Navigate, { to: "/login", replace: true }) }), _jsx(Route, { path: "/", element: _jsx(Navigate, { to: isAuthenticated ? "/dashboard" : "/login", replace: true }) }), _jsx(Route, { path: "/", element: _jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-4xl font-bold text-gray-900 mb-4", children: "404" }), _jsx("p", { className: "text-gray-600 mb-8", children: "Halaman yang Anda cari tidak ditemukan." }), _jsx("a", { href: isAuthenticated ? "/dashboard" : "/login", className: "btn btn-primary", children: isAuthenticated ? "Kembali ke Dashboard" : "Kembali ke Login" })] }) }) })] }));
}
export default App;
//# sourceMappingURL=App.js.map