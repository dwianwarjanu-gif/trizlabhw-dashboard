import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingBagIcon, ClipboardDocumentListIcon, CubeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { analyticsApi } from '@/services/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatsCard from '@/components/dashboard/StatsCard';
import RecentOrders from '@/components/dashboard/RecentOrders';
import LowStockAlert from '@/components/dashboard/LowStockAlert';
import SalesChart from '@/components/dashboard/SalesChart';
import MarketplacePerformance from '@/components/dashboard/MarketplacePerformance';
const Dashboard = () => {
    const { user } = useAuth();
    if (!user) {
        return _jsx("div", { children: "Loading..." });
    }
    return (_jsxs("div", { children: [_jsx("h1", { children: "Dashboard" }), _jsxs("p", { children: ["Welcome ", user.fullName] })] }));
};
const DashboardPage = () => {
    const { data: analytics, isLoading, error } = useQuery({
        queryKey: ['dashboard-analytics'],
        queryFn: () => analyticsApi.getDashboard({ period: 'month' }),
        refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    });
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(LoadingSpinner, { size: "lg", text: "Memuat data dashboard..." }) }));
    }
    if (error) {
        return (_jsxs("div", { className: "text-center py-12", children: [_jsx(ExclamationTriangleIcon, { className: "mx-auto h-12 w-12 text-red-400" }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "Error memuat data" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Terjadi kesalahan saat memuat data dashboard." })] }));
    }
    const dashboardData = analytics?.data?.analytics;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Dashboard" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Ringkasan aktivitas toko Anda bulan ini" })] }), _jsxs("div", { className: "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4", children: [_jsx(StatsCard, { title: "Total Pesanan", value: dashboardData?.summary?.totalOrders?.current || 0, previousValue: dashboardData?.summary?.totalOrders?.previous || 0, growth: dashboardData?.summary?.totalOrders?.growth || 0, icon: ClipboardDocumentListIcon, color: "blue" }), _jsx(StatsCard, { title: "Total Pendapatan", value: dashboardData?.summary?.totalRevenue?.current || 0, previousValue: dashboardData?.summary?.totalRevenue?.previous || 0, growth: dashboardData?.summary?.totalRevenue?.growth || 0, icon: ShoppingBagIcon, color: "green", format: "currency" }), _jsx(StatsCard, { title: "Total Produk", value: dashboardData?.summary?.totalProducts || 0, icon: CubeIcon, color: "purple" }), _jsx(StatsCard, { title: "Stok Rendah", value: dashboardData?.summary?.lowStockCount || 0, icon: ExclamationTriangleIcon, color: "red", alert: dashboardData?.summary?.lowStockCount > 0 })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-soft p-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Penjualan 30 Hari Terakhir" }), _jsx(SalesChart, {})] }), _jsxs("div", { className: "bg-white rounded-lg shadow-soft p-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Performa Marketplace" }), _jsx(MarketplacePerformance, { data: dashboardData?.revenueByMarketplace || [] })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx("div", { className: "lg:col-span-2", children: _jsx(RecentOrders, {}) }), _jsx("div", { children: _jsx(LowStockAlert, {}) })] }), dashboardData?.topProducts && dashboardData.topProducts.length > 0 && (_jsxs("div", { className: "bg-white rounded-lg shadow-soft p-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Produk Terlaris" }), _jsx("div", { className: "space-y-4", children: dashboardData.topProducts.slice(0, 5).map((item, index) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("span", { className: "inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-800 text-sm font-medium", children: index + 1 }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: item.product?.name }), _jsxs("p", { className: "text-sm text-gray-500", children: ["SKU: ", item.product?.sku] })] })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "text-sm font-medium text-gray-900", children: [item._sum?.quantity || 0, " terjual"] }), _jsxs("p", { className: "text-sm text-gray-500", children: ["Rp ", (item._sum?.totalPrice || 0).toLocaleString('id-ID')] })] })] }, item.productId))) })] }))] }));
};
export default DashboardPage;
//# sourceMappingURL=DashboardPage.js.map