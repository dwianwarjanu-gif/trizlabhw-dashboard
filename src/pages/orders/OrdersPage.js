import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, FunnelIcon, EyeIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { ordersApi } from '@/services/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Pagination from '@/components/ui/Pagination';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import OrderFilters from '@/components/orders/OrderFilters';
import { cn } from '@/utils/cn';
const OrdersPage = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        marketplaceAccountId: '',
        startDate: '',
        endDate: '',
        sortBy: 'orderDate',
        sortOrder: 'desc'
    });
    const [showFilters, setShowFilters] = useState(false);

    const handleSearch = (e) => {
      e.preventDefault()
      setPage(1)
    }

    const handleFilterChange = (newFilters) => {
      setFilters(prev => ({ ...prev, ...newFilters }))
      setPage(1)
    }

    const { data: ordersData, isLoading, error, refetch } = useQuery({
      queryKey: ['orders', page, search, filters],
      queryFn: async () => {
        const res = await ordersApi.getAll({
          page,
          limit: 20,
          search,
          ...filters
       })

       return res.data.data
     }
   })

    const orders = ordersData?.orders || []
    const pagination = ordersData?.pagination || null
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Pesanan" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Kelola semua pesanan dari berbagai marketplace" })] }), _jsx("div", { className: "mt-4 sm:mt-0", children: _jsxs("button", { onClick: () => refetch(), className: "btn btn-outline btn-md", children: [_jsx(ArrowPathIcon, { className: "h-5 w-5 mr-2" }), "Refresh"] }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-soft p-6", children: [_jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4", children: [_jsx("form", { onSubmit: handleSearch, className: "flex-1 max-w-lg", children: _jsxs("div", { className: "relative", children: [_jsx(MagnifyingGlassIcon, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Cari nomor pesanan atau ID marketplace...", value: search, onChange: (e) => setSearch(e.target.value), className: "input pl-10 w-full" })] }) }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("select", { value: `${filters.sortBy}-${filters.sortOrder}`, onChange: (e) => {
                                            const [sortBy, sortOrder] = e.target.value.split('-');
                                            handleFilterChange({ sortBy, sortOrder });
                                        }, className: "input text-sm", children: [_jsx("option", { value: "orderDate-desc", children: "Terbaru" }), _jsx("option", { value: "orderDate-asc", children: "Terlama" }), _jsx("option", { value: "totalAmount-desc", children: "Nilai Tertinggi" }), _jsx("option", { value: "totalAmount-asc", children: "Nilai Terendah" })] }), _jsxs("button", { type: "button", onClick: () => setShowFilters(!showFilters), className: cn('btn btn-outline btn-md', showFilters && 'bg-gray-50'), children: [_jsx(FunnelIcon, { className: "h-5 w-5 mr-2" }), "Filter"] })] })] }), showFilters && (_jsx("div", { className: "mt-6 pt-6 border-t border-gray-200", children: _jsx(OrderFilters, { filters: filters, onFilterChange: handleFilterChange }) }))] }), _jsx("div", { className: "bg-white rounded-lg shadow-soft", children: isLoading ? (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(LoadingSpinner, { size: "lg", text: "Memuat pesanan..." }) })) : error ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(ExclamationTriangleIcon, { className: "mx-auto h-12 w-12 text-red-400" }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "Error memuat data" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Terjadi kesalahan saat memuat pesanan." }), _jsx("button", { onClick: () => refetch(), className: "mt-4 btn btn-primary btn-sm", children: "Coba Lagi" })] })) : orders.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "mx-auto h-12 w-12 text-gray-400", children: _jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1, d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }) }) }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "Belum ada pesanan" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Pesanan akan muncul di sini setelah sinkronisasi dengan marketplace." })] })) : (_jsxs("div", { className: "overflow-hidden", children: [_jsx("div", { className: "bg-gray-50 px-6 py-3 border-b border-gray-200", children: _jsxs("div", { className: "grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider", children: [_jsx("div", { className: "col-span-3", children: "Pesanan" }), _jsx("div", { className: "col-span-2", children: "Marketplace" }), _jsx("div", { className: "col-span-2", children: "Status" }), _jsx("div", { className: "col-span-2", children: "Total" }), _jsx("div", { className: "col-span-2", children: "Tanggal" }), _jsx("div", { className: "col-span-1", children: "Aksi" })] }) }), _jsx("div", { className: "divide-y divide-gray-200", children: orders.map((order) => (_jsx("div", { className: "px-6 py-4 hover:bg-gray-50", children: _jsxs("div", { className: "grid grid-cols-12 gap-4 items-center", children: [_jsx("div", { className: "col-span-3", children: _jsxs("div", { className: "flex flex-col", children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: order.email }), _jsxs("p", { className: "text-sm text-gray-500", children: ["ID: ", order.marketplaceOrderId] }), _jsxs("p", { className: "text-xs text-gray-400 mt-1", children: [order._count?.orderItems || 0, " item"] })] }) }), _jsx("div", { className: "col-span-2", children: _jsx("div", { className: "flex items-center", children: _jsx("span", { className: "text-sm font-medium text-gray-900", children: order.marketplaceAccount?.marketplace?.name }) }) }), _jsx("div", { className: "col-span-2", children: _jsx(OrderStatusBadge, { status: order.status }) }), _jsx("div", { className: "col-span-2", children: _jsxs("div", { className: "flex flex-col", children: [_jsxs("span", { className: "text-sm font-medium text-gray-900", children: ["Rp ", order.totalAmount?.toLocaleString('id-ID')] }), order.shippingCost > 0 && (_jsxs("span", { className: "text-xs text-gray-500", children: ["+ Rp ", order.shippingCost?.toLocaleString('id-ID'), " ongkir"] }))] }) }), _jsx("div", { className: "col-span-2", children: _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "text-sm text-gray-900", children: new Date(order.orderDate).toLocaleDateString('id-ID', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        }) }), _jsx("span", { className: "text-xs text-gray-500", children: new Date(order.orderDate).toLocaleTimeString('id-ID', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        }) })] }) }), _jsx("div", { className: "col-span-1", children: _jsx(Link, { to: `/orders/${order.id}`, className: "text-primary-600 hover:text-primary-500", children: _jsx(EyeIcon, { className: "h-5 w-5" }) }) })] }) }, order.id))) }), pagination && pagination.totalPages > 1 && (_jsx("div", { className: "px-6 py-4 border-t border-gray-200", children: _jsx(Pagination, { currentPage: pagination.page, totalPages: pagination.totalPages, onPageChange: setPage }) }))] })) })] }));
};
export default OrdersPage;
//# sourceMappingURL=OrdersPage.js.map