import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChartBarIcon, DocumentChartBarIcon, CurrencyDollarIcon, ShoppingBagIcon, BuildingStorefrontIcon, ArchiveBoxIcon, CalendarIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { reportsApi } from '@/services/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ReportCard from '@/components/reports/ReportCard';
import SalesChart from '@/components/reports/SalesChart';
import RevenueChart from '@/components/reports/RevenueChart';
import MarketplaceChart from '@/components/reports/MarketplaceChart';
import ProductPerformanceTable from '@/components/reports/ProductPerformanceTable';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { cn } from '@/utils/cn';
const ReportsPage = () => {
    const [timeRange, setTimeRange] = useState('month');
    const [selectedReport, setSelectedReport] = useState('overview');
    const [dateRange, setDateRange] = useState({
        startDate: null,
        endDate: null
    });
    // Fetch dashboard analytics
    const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
        queryKey: ['dashboard-analytics', timeRange],
        queryFn: () => reportsApi.getDashboard(timeRange)
    });
    // Fetch sales report
    const { data: salesData, isLoading: salesLoading } = useQuery({
        queryKey: ['sales-report', dateRange, timeRange],
        queryFn: () => reportsApi.getSalesReport({
            timeRange,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            groupBy: 'day'
        }),
        enabled: selectedReport === 'sales'
    });
    // Fetch product performance
    const { data: productsData, isLoading: productsLoading } = useQuery({
        queryKey: ['product-performance', timeRange],
        queryFn: () => reportsApi.getProductPerformance({
            timeRange,
            limit: 20,
            sortBy: 'revenue'
        }),
        enabled: selectedReport === 'products'
    });
    // Fetch marketplace performance
    const { data: marketplacesData, isLoading: marketplacesLoading } = useQuery({
        queryKey: ['marketplace-performance', timeRange],
        queryFn: () => reportsApi.getMarketplacePerformance({ timeRange }),
        enabled: selectedReport === 'marketplaces'
    });
    // Fetch inventory report
    const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
        queryKey: ['inventory-report'],
        queryFn: () => reportsApi.getInventoryReport({
            includeMovements: false,
            lowStockOnly: false
        }),
        enabled: selectedReport === 'inventory'
    });
    // Fetch financial report
    const { data: financialData, isLoading: financialLoading } = useQuery({
        queryKey: ['financial-report', timeRange],
        queryFn: () => reportsApi.getFinancialReport({ timeRange }),
        enabled: selectedReport === 'financial'
    });
    const analytics = analyticsData?.data?.analytics;
    const salesReport = salesData?.data?.report;
    const productPerformance = productsData?.data?.products;
    const marketplacePerformance = marketplacesData?.data?.marketplaces;
    const inventoryReport = inventoryData?.data;
    const financialReport = financialData?.data?.financial;
    const timeRangeOptions = [
        { value: 'today', label: 'Hari Ini' },
        { value: 'week', label: '7 Hari' },
        { value: 'month', label: '30 Hari' },
        { value: 'quarter', label: '3 Bulan' },
        { value: 'year', label: '1 Tahun' }
    ];
    const reportTabs = [
        { id: 'overview', label: 'Overview', icon: ChartBarIcon },
        { id: 'sales', label: 'Penjualan', icon: CurrencyDollarIcon },
        { id: 'products', label: 'Produk', icon: ShoppingBagIcon },
        { id: 'marketplaces', label: 'Marketplace', icon: BuildingStorefrontIcon },
        { id: 'inventory', label: 'Inventori', icon: ArchiveBoxIcon },
        { id: 'financial', label: 'Keuangan', icon: DocumentChartBarIcon }
    ];
    const handleExportReport = (format) => {
        // Implementation for export functionality
        console.log(`Exporting ${selectedReport} report as ${format}`);
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Laporan & Analytics" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Analisis performa bisnis dan laporan komprehensif" })] }), _jsxs("div", { className: "mt-4 sm:mt-0 flex items-center space-x-3", children: [_jsx("select", { value: timeRange, onChange: (e) => setTimeRange(e.target.value), className: "input text-sm", children: timeRangeOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) }), _jsx(DateRangePicker, { startDate: dateRange.startDate, endDate: dateRange.endDate, onChange: setDateRange }), _jsxs("div", { className: "flex space-x-2", children: [_jsxs("button", { onClick: () => handleExportReport('csv'), className: "btn btn-outline btn-sm", children: [_jsx(ArrowDownTrayIcon, { className: "h-4 w-4 mr-2" }), "CSV"] }), _jsxs("button", { onClick: () => handleExportReport('pdf'), className: "btn btn-outline btn-sm", children: [_jsx(ArrowDownTrayIcon, { className: "h-4 w-4 mr-2" }), "PDF"] })] })] })] }), _jsx("div", { className: "border-b border-gray-200", children: _jsx("nav", { className: "-mb-px flex space-x-8", children: reportTabs.map((tab) => (_jsxs("button", { onClick: () => setSelectedReport(tab.id), className: cn('flex items-center py-2 px-1 border-b-2 font-medium text-sm', selectedReport === tab.id
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'), children: [_jsx(tab.icon, { className: "h-5 w-5 mr-2" }), tab.label] }, tab.id))) }) }), _jsxs("div", { className: "space-y-6", children: [selectedReport === 'overview' && (_jsx(_Fragment, { children: analyticsLoading ? (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(LoadingSpinner, { size: "lg", text: "Memuat analytics..." }) })) : analytics ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsx(ReportCard, { title: "Total Revenue", value: `Rp ${analytics.summary.totalRevenue.current?.toLocaleString('id-ID') || 0}`, change: analytics.summary.totalRevenue.growth, icon: CurrencyDollarIcon, color: "green" }), _jsx(ReportCard, { title: "Total Pesanan", value: analytics.summary.totalOrders.current || 0, change: analytics.summary.totalOrders.growth, icon: ShoppingBagIcon, color: "blue" }), _jsx(ReportCard, { title: "Total Produk", value: analytics.summary.totalProducts || 0, icon: ArchiveBoxIcon, color: "purple" }), _jsx(ReportCard, { title: "Stok Rendah", value: analytics.summary.lowStockCount || 0, icon: ExclamationTriangleIcon, color: "red" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-soft p-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Revenue Harian" }), _jsx(RevenueChart, { data: analytics.charts.revenueByDay })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-soft p-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Performance Marketplace" }), _jsx(MarketplaceChart, { data: analytics.charts.revenueByMarketplace })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-soft p-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Produk Terlaris" }), _jsx("div", { className: "space-y-3", children: analytics.topProducts?.slice(0, 5).map((product, index) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("span", { className: "text-sm font-medium text-gray-500", children: ["#", index + 1] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: product.product?.name }), _jsxs("p", { className: "text-xs text-gray-500", children: [product._sum.quantity, " terjual"] })] })] }), _jsxs("span", { className: "text-sm font-medium text-gray-900", children: ["Rp ", product._sum.totalPrice?.toLocaleString('id-ID')] })] }, product.productId))) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-soft p-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Pesanan Terbaru" }), _jsx("div", { className: "space-y-3", children: analytics.recentOrders?.slice(0, 5).map((order) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: order.orderNumber }), _jsx("p", { className: "text-xs text-gray-500", children: order.marketplaceAccount?.marketplace?.name })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "text-sm font-medium text-gray-900", children: ["Rp ", order.totalAmount?.toLocaleString('id-ID')] }), _jsx("p", { className: "text-xs text-gray-500", children: new Date(order.orderDate).toLocaleDateString('id-ID') })] })] }, order.id))) })] })] })] })) : (_jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-gray-500", children: "Tidak ada data analytics" }) })) })), selectedReport === 'sales' && (_jsx("div", { className: "space-y-6", children: salesLoading ? (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(LoadingSpinner, { size: "lg", text: "Memuat laporan penjualan..." }) })) : salesReport ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-6", children: [_jsx(ReportCard, { title: "Total Revenue", value: `Rp ${salesReport.summary.totalRevenue?.toLocaleString('id-ID') || 0}`, icon: CurrencyDollarIcon, color: "green" }), _jsx(ReportCard, { title: "Total Pesanan", value: salesReport.summary.totalOrders || 0, icon: ShoppingBagIcon, color: "blue" }), _jsx(ReportCard, { title: "Rata-rata Nilai Pesanan", value: `Rp ${salesReport.summary.averageOrderValue?.toLocaleString('id-ID') || 0}`, icon: ChartBarIcon, color: "purple" })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-soft p-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Trend Penjualan" }), _jsx(SalesChart, { data: salesReport.salesData })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-soft p-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Breakdown Status Pesanan" }), _jsx("div", { className: "space-y-3", children: salesReport.statusBreakdown?.map((status) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: status.status }), _jsxs("div", { className: "text-right", children: [_jsxs("span", { className: "text-sm font-medium text-gray-900", children: [status.count, " pesanan"] }), _jsxs("p", { className: "text-xs text-gray-500", children: ["Rp ", status.revenue?.toLocaleString('id-ID')] })] })] }, status.status))) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-soft p-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Perbandingan Marketplace" }), _jsx("div", { className: "space-y-3", children: salesReport.marketplaceComparison?.map((marketplace) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: marketplace.marketplaceName }), _jsxs("div", { className: "text-right", children: [_jsxs("span", { className: "text-sm font-medium text-gray-900", children: [marketplace.orders, " pesanan"] }), _jsxs("p", { className: "text-xs text-gray-500", children: ["Rp ", marketplace.revenue?.toLocaleString('id-ID')] })] })] }, marketplace.marketplaceId))) })] })] })] })) : (_jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-gray-500", children: "Tidak ada data penjualan" }) })) })), selectedReport === 'products' && (_jsx("div", { className: "space-y-6", children: productsLoading ? (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(LoadingSpinner, { size: "lg", text: "Memuat performa produk..." }) })) : productPerformance ? (_jsx(ProductPerformanceTable, { products: productPerformance })) : (_jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-gray-500", children: "Tidak ada data produk" }) })) }))] })] }));
};
export default ReportsPage;
//# sourceMappingURL=ReportsPage.js.map