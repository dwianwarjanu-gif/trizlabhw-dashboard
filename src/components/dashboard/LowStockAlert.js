import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon, CubeIcon } from '@heroicons/react/24/outline';
import { inventoryApi } from '@/services/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
const LowStockAlert = () => {
    const { data: lowStockData, isLoading } = useQuery({
        queryKey: ['low-stock-items'],
        queryFn: () => inventoryApi.getLowStock(),
        refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    });
    if (isLoading) {
        return (_jsxs("div", { className: "bg-white rounded-lg shadow-soft p-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Peringatan Stok Rendah" }), _jsx("div", { className: "flex items-center justify-center h-32", children: _jsx(LoadingSpinner, { size: "md", text: "Memuat data stok..." }) })] }));
    }
    const lowStockItems = lowStockData?.data?.lowStockItems || [];
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-soft p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Peringatan Stok Rendah" }), _jsx(Link, { to: "/inventory?lowStock=true", className: "text-sm text-primary-600 hover:text-primary-500 font-medium", children: "Lihat semua" })] }), lowStockItems.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(CubeIcon, { className: "mx-auto h-12 w-12 text-green-400" }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "Stok Aman" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Semua produk memiliki stok yang cukup" })] })) : (_jsxs("div", { className: "space-y-3", children: [lowStockItems.slice(0, 5).map((item) => (_jsxs("div", { className: "flex items-center p-3 bg-red-50 border border-red-200 rounded-lg", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(ExclamationTriangleIcon, { className: "h-5 w-5 text-red-400" }) }), _jsxs("div", { className: "ml-3 flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("p", { className: "text-sm font-medium text-gray-900 truncate", children: [item.product?.name, item.variant && (_jsxs("span", { className: "text-gray-500 ml-1", children: ["- ", item.variant.variantName] }))] }), _jsxs("span", { className: "text-sm font-medium text-red-600", children: [item.stockQuantity, " tersisa"] })] }), _jsxs("div", { className: "mt-1 flex items-center text-xs text-gray-500", children: [_jsxs("span", { children: ["SKU: ", item.variant?.sku || item.product?.sku] }), _jsx("span", { className: "mx-2", children: "\u2022" }), _jsxs("span", { children: ["Min: ", item.minStockLevel] })] })] })] }, `${item.productId}-${item.variantId || 'main'}`))), lowStockItems.length > 5 && (_jsx("div", { className: "text-center pt-2", children: _jsxs(Link, { to: "/inventory?lowStock=true", className: "text-sm text-red-600 hover:text-red-500 font-medium", children: ["+", lowStockItems.length - 5, " produk lainnya"] }) }))] }))] }));
};
export default LowStockAlert;
//# sourceMappingURL=LowStockAlert.js.map