import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { EyeIcon } from '@heroicons/react/24/outline';
import { ordersApi } from '@/services/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn } from '@/utils/cn';
const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PROCESSING: 'bg-purple-100 text-purple-800',
    SHIPPED: 'bg-indigo-100 text-indigo-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-gray-100 text-gray-800'
};
const statusLabels = {
    PENDING: 'Menunggu',
    CONFIRMED: 'Dikonfirmasi',
    PROCESSING: 'Diproses',
    SHIPPED: 'Dikirim',
    DELIVERED: 'Selesai',
    CANCELLED: 'Dibatalkan',
    REFUNDED: 'Dikembalikan'
};
const RecentOrders = () => {
    const { data: ordersData, isLoading } = useQuery({
        queryKey: ['recent-orders'],
        queryFn: () => ordersApi.getAll({ page: 1, limit: 5 }),
        refetchInterval: 30 * 1000, // Refetch every 30 seconds
    });
    if (isLoading) {
        return (_jsxs("div", { className: "bg-white rounded-lg shadow-soft p-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Pesanan Terbaru" }), _jsx("div", { className: "flex items-center justify-center h-32", children: _jsx(LoadingSpinner, { size: "md", text: "Memuat pesanan..." }) })] }));
    }
    const orders = ordersData?.data?.orders || [];
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-soft p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Pesanan Terbaru" }), _jsx(Link, { to: "/orders", className: "text-sm text-primary-600 hover:text-primary-500 font-medium", children: "Lihat semua" })] }), orders.length === 0 ? (_jsx("div", { className: "text-center py-8", children: _jsx("p", { className: "text-gray-500", children: "Belum ada pesanan" }) })) : (_jsx("div", { className: "space-y-4", children: orders.map((order) => (_jsxs("div", { className: "flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 truncate", children: order.orderNumber }), _jsx("span", { className: cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', statusColors[order.status]), children: statusLabels[order.status] })] }), _jsxs("div", { className: "mt-1 flex items-center text-sm text-gray-500", children: [_jsx("span", { children: order.marketplaceAccount?.marketplace?.name }), _jsx("span", { className: "mx-2", children: "\u2022" }), _jsxs("span", { children: ["Rp ", order.totalAmount?.toLocaleString('id-ID')] }), _jsx("span", { className: "mx-2", children: "\u2022" }), _jsxs("span", { children: [order._count?.orderItems || 0, " item"] })] }), _jsx("p", { className: "mt-1 text-xs text-gray-400", children: new Date(order.orderDate).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) })] }), _jsx("div", { className: "ml-4 flex-shrink-0", children: _jsx(Link, { to: `/orders/${order.id}`, className: "inline-flex items-center p-2 text-gray-400 hover:text-gray-600 transition-colors", children: _jsx(EyeIcon, { className: "h-5 w-5" }) }) })] }, order.id))) }))] }));
};
export default RecentOrders;
//# sourceMappingURL=RecentOrders.js.map