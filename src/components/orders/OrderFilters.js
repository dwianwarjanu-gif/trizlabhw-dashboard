import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { XMarkIcon } from '@heroicons/react/24/outline';
// Mock marketplace accounts API - replace with actual API call
const marketplaceAccountsApi = {
    getAll: () => Promise.resolve({
        data: {
            accounts: [
                { id: '1', storeName: 'Toko Shopee', marketplace: { name: 'Shopee', code: 'SHOPEE' } },
                { id: '2', storeName: 'Toko Tokopedia', marketplace: { name: 'Tokopedia', code: 'TOKOPEDIA' } },
                { id: '3', storeName: 'Toko Lazada', marketplace: { name: 'Lazada', code: 'LAZADA' } }
            ]
        }
    })
};
const OrderFilters = ({ filters, onFilterChange }) => {
    const { data: accountsData } = useQuery({
        queryKey: ['marketplace-accounts'],
        queryFn: marketplaceAccountsApi.getAll
    });
    const accounts = accountsData?.data?.accounts || [];
    const handleFilterChange = (key, value) => {
        onFilterChange({ [key]: value });
    };
    const clearFilters = () => {
        onFilterChange({
            status: '',
            marketplaceAccountId: '',
            startDate: '',
            endDate: '',
            sortBy: 'orderDate',
            sortOrder: 'desc'
        });
    };
    const hasActiveFilters = filters.status || filters.marketplaceAccountId ||
        filters.startDate || filters.endDate;
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-sm font-medium text-gray-900", children: "Filter Pesanan" }), hasActiveFilters && (_jsxs("button", { type: "button", onClick: clearFilters, className: "text-sm text-primary-600 hover:text-primary-500 flex items-center", children: [_jsx(XMarkIcon, { className: "h-4 w-4 mr-1" }), "Hapus Filter"] }))] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Status Pesanan" }), _jsxs("select", { value: filters.status, onChange: (e) => handleFilterChange('status', e.target.value), className: "input text-sm w-full", children: [_jsx("option", { value: "", children: "Semua Status" }), _jsx("option", { value: "PENDING", children: "Menunggu" }), _jsx("option", { value: "CONFIRMED", children: "Dikonfirmasi" }), _jsx("option", { value: "PROCESSING", children: "Diproses" }), _jsx("option", { value: "SHIPPED", children: "Dikirim" }), _jsx("option", { value: "DELIVERED", children: "Selesai" }), _jsx("option", { value: "CANCELLED", children: "Dibatalkan" }), _jsx("option", { value: "REFUNDED", children: "Dikembalikan" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Marketplace" }), _jsxs("select", { value: filters.marketplaceAccountId, onChange: (e) => handleFilterChange('marketplaceAccountId', e.target.value), className: "input text-sm w-full", children: [_jsx("option", { value: "", children: "Semua Marketplace" }), accounts.map((account) => (_jsxs("option", { value: account.id, children: [account.marketplace.name, " - ", account.storeName] }, account.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Tanggal Mulai" }), _jsx("input", { type: "date", value: filters.startDate, onChange: (e) => handleFilterChange('startDate', e.target.value), className: "input text-sm w-full" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Tanggal Akhir" }), _jsx("input", { type: "date", value: filters.endDate, onChange: (e) => handleFilterChange('endDate', e.target.value), className: "input text-sm w-full" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Rentang Nilai Pesanan" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx("div", { children: _jsx("input", { type: "number", placeholder: "Nilai minimum", className: "input text-sm w-full", min: "0" }) }), _jsx("div", { children: _jsx("input", { type: "number", placeholder: "Nilai maksimum", className: "input text-sm w-full", min: "0" }) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Filter Cepat" }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx("button", { type: "button", onClick: () => handleFilterChange('startDate', new Date().toISOString().split('T')[0]), className: "btn btn-outline btn-sm", children: "Hari Ini" }), _jsx("button", { type: "button", onClick: () => {
                                    const weekAgo = new Date();
                                    weekAgo.setDate(weekAgo.getDate() - 7);
                                    handleFilterChange('startDate', weekAgo.toISOString().split('T')[0]);
                                }, className: "btn btn-outline btn-sm", children: "7 Hari Terakhir" }), _jsx("button", { type: "button", onClick: () => {
                                    const monthAgo = new Date();
                                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                                    handleFilterChange('startDate', monthAgo.toISOString().split('T')[0]);
                                }, className: "btn btn-outline btn-sm", children: "30 Hari Terakhir" }), _jsx("button", { type: "button", onClick: () => handleFilterChange('status', 'PENDING'), className: "btn btn-outline btn-sm", children: "Perlu Diproses" })] })] }), hasActiveFilters && (_jsx("div", { className: "pt-4 border-t border-gray-200", children: _jsxs("div", { className: "flex flex-wrap gap-2", children: [filters.status && (_jsxs("span", { className: "inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800", children: ["Status: ", filters.status, _jsx("button", { type: "button", onClick: () => handleFilterChange('status', ''), className: "ml-2 text-primary-600 hover:text-primary-800", children: _jsx(XMarkIcon, { className: "h-4 w-4" }) })] })), filters.marketplaceAccountId && (_jsxs("span", { className: "inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800", children: ["Marketplace: ", accounts.find(a => a.id === filters.marketplaceAccountId)?.marketplace.name, _jsx("button", { type: "button", onClick: () => handleFilterChange('marketplaceAccountId', ''), className: "ml-2 text-primary-600 hover:text-primary-800", children: _jsx(XMarkIcon, { className: "h-4 w-4" }) })] })), filters.startDate && (_jsxs("span", { className: "inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800", children: ["Dari: ", new Date(filters.startDate).toLocaleDateString('id-ID'), _jsx("button", { type: "button", onClick: () => handleFilterChange('startDate', ''), className: "ml-2 text-primary-600 hover:text-primary-800", children: _jsx(XMarkIcon, { className: "h-4 w-4" }) })] })), filters.endDate && (_jsxs("span", { className: "inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800", children: ["Sampai: ", new Date(filters.endDate).toLocaleDateString('id-ID'), _jsx("button", { type: "button", onClick: () => handleFilterChange('endDate', ''), className: "ml-2 text-primary-600 hover:text-primary-800", children: _jsx(XMarkIcon, { className: "h-4 w-4" }) })] }))] }) }))] }));
};
export default OrderFilters;
//# sourceMappingURL=OrderFilters.js.map