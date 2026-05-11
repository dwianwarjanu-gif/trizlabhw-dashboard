import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { XMarkIcon } from '@heroicons/react/24/outline';
// Mock categories API - replace with actual API call
const categoriesApi = {
    getAll: () => Promise.resolve({
        data: {
            categories: [
                { id: '1', name: 'Elektronik' },
                { id: '2', name: 'Fashion' },
                { id: '3', name: 'Rumah & Taman' },
                { id: '4', name: 'Olahraga' },
                { id: '5', name: 'Kecantikan' }
            ]
        }
    })
};
const ProductFilters = ({ filters, onFilterChange }) => {
    const { data: categoriesData } = useQuery({
        queryKey: ['categories'],
        queryFn: categoriesApi.getAll
    });
    const categories = categoriesData?.data?.categories || [];
    const handleFilterChange = (key, value) => {
        onFilterChange({ [key]: value });
    };
    const clearFilters = () => {
        onFilterChange({
            categoryId: '',
            isActive: '',
            sortBy: 'createdAt',
            sortOrder: 'desc'
        });
    };
    const hasActiveFilters = filters.categoryId || filters.isActive;
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-sm font-medium text-gray-900", children: "Filter Produk" }), hasActiveFilters && (_jsxs("button", { type: "button", onClick: clearFilters, className: "text-sm text-primary-600 hover:text-primary-500 flex items-center", children: [_jsx(XMarkIcon, { className: "h-4 w-4 mr-1" }), "Hapus Filter"] }))] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Kategori" }), _jsxs("select", { value: filters.categoryId, onChange: (e) => handleFilterChange('categoryId', e.target.value), className: "input text-sm w-full", children: [_jsx("option", { value: "", children: "Semua Kategori" }), categories.map((category) => (_jsx("option", { value: category.id, children: category.name }, category.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Status" }), _jsxs("select", { value: filters.isActive, onChange: (e) => handleFilterChange('isActive', e.target.value), className: "input text-sm w-full", children: [_jsx("option", { value: "", children: "Semua Status" }), _jsx("option", { value: "true", children: "Aktif" }), _jsx("option", { value: "false", children: "Nonaktif" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Status Stok" }), _jsxs("select", { value: "", onChange: (e) => {
                                    // Handle stock status filter
                                    console.log('Stock filter:', e.target.value);
                                }, className: "input text-sm w-full", children: [_jsx("option", { value: "", children: "Semua Stok" }), _jsx("option", { value: "in-stock", children: "Tersedia" }), _jsx("option", { value: "low-stock", children: "Stok Rendah" }), _jsx("option", { value: "out-of-stock", children: "Habis" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Status Sync" }), _jsxs("select", { value: "", onChange: (e) => {
                                    // Handle sync status filter
                                    console.log('Sync filter:', e.target.value);
                                }, className: "input text-sm w-full", children: [_jsx("option", { value: "", children: "Semua" }), _jsx("option", { value: "synced", children: "Tersinkron" }), _jsx("option", { value: "pending", children: "Menunggu" }), _jsx("option", { value: "failed", children: "Gagal" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Rentang Harga" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx("div", { children: _jsx("input", { type: "number", placeholder: "Harga minimum", className: "input text-sm w-full", min: "0" }) }), _jsx("div", { children: _jsx("input", { type: "number", placeholder: "Harga maksimum", className: "input text-sm w-full", min: "0" }) })] })] }), hasActiveFilters && (_jsx("div", { className: "pt-4 border-t border-gray-200", children: _jsxs("div", { className: "flex flex-wrap gap-2", children: [filters.categoryId && (_jsxs("span", { className: "inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800", children: ["Kategori: ", categories.find(c => c.id === filters.categoryId)?.name, _jsx("button", { type: "button", onClick: () => handleFilterChange('categoryId', ''), className: "ml-2 text-primary-600 hover:text-primary-800", children: _jsx(XMarkIcon, { className: "h-4 w-4" }) })] })), filters.isActive && (_jsxs("span", { className: "inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800", children: ["Status: ", filters.isActive === 'true' ? 'Aktif' : 'Nonaktif', _jsx("button", { type: "button", onClick: () => handleFilterChange('isActive', ''), className: "ml-2 text-primary-600 hover:text-primary-800", children: _jsx(XMarkIcon, { className: "h-4 w-4" }) })] }))] }) }))] }));
};
export default ProductFilters;
//# sourceMappingURL=ProductFilters.js.map