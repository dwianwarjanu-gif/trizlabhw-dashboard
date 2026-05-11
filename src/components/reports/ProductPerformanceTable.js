import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';
const ProductPerformanceTable = ({ products }) => {
    const [sortField, setSortField] = useState('revenue');
    const [sortDirection, setSortDirection] = useState('desc');
    const [searchTerm, setSearchTerm] = useState('');
    // Filter products based on search term
    const filteredProducts = products.filter(product => product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    // Sort products
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortDirection === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return 0;
    });
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        }
        else {
            setSortField(field);
            setSortDirection('desc');
        }
    };
    const SortIcon = ({ field }) => {
        if (sortField !== field) {
            return _jsx("div", { className: "w-4 h-4" });
        }
        return sortDirection === 'asc'
            ? _jsx(ChevronUpIcon, { className: "w-4 h-4" })
            : _jsx(ChevronDownIcon, { className: "w-4 h-4" });
    };
    if (!products || products.length === 0) {
        return (_jsx("div", { className: "bg-white rounded-lg shadow-soft p-6", children: _jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "mx-auto h-12 w-12 text-gray-400", children: _jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1, d: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" }) }) }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "Tidak ada data produk" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Belum ada data performa produk untuk periode ini." })] }) }));
    }
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-soft", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Performa Produk" }), _jsxs("div", { className: "relative", children: [_jsx(MagnifyingGlassIcon, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Cari produk atau SKU...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500" })] })] }) }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Rank" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100", onClick: () => handleSort('productName'), children: _jsxs("div", { className: "flex items-center space-x-1", children: [_jsx("span", { children: "Produk" }), _jsx(SortIcon, { field: "productName" })] }) }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100", onClick: () => handleSort('quantitySold'), children: _jsxs("div", { className: "flex items-center space-x-1", children: [_jsx("span", { children: "Qty Terjual" }), _jsx(SortIcon, { field: "quantitySold" })] }) }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100", onClick: () => handleSort('revenue'), children: _jsxs("div", { className: "flex items-center space-x-1", children: [_jsx("span", { children: "Revenue" }), _jsx(SortIcon, { field: "revenue" })] }) }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100", onClick: () => handleSort('orderCount'), children: _jsxs("div", { className: "flex items-center space-x-1", children: [_jsx("span", { children: "Jumlah Order" }), _jsx(SortIcon, { field: "orderCount" })] }) }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Avg Order Value" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: sortedProducts.map((product, index) => {
                                const avgOrderValue = product.orderCount > 0
                                    ? product.revenue / product.orderCount
                                    : 0;
                                return (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "flex items-center", children: _jsx("span", { className: cn('inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium', index < 3
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-gray-100 text-gray-600'), children: index + 1 }) }) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex flex-col", children: [_jsx("div", { className: "text-sm font-medium text-gray-900 truncate max-w-xs", children: product.productName }), _jsxs("div", { className: "text-sm text-gray-500", children: ["SKU: ", product.sku] })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "text-sm font-medium text-gray-900", children: product.quantitySold.toLocaleString('id-ID') }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "text-sm font-medium text-gray-900", children: ["Rp ", product.revenue.toLocaleString('id-ID')] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "text-sm font-medium text-gray-900", children: product.orderCount.toLocaleString('id-ID') }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "text-sm text-gray-900", children: ["Rp ", avgOrderValue.toLocaleString('id-ID')] }) })] }, product.productId));
                            }) })] }) }), _jsx("div", { className: "px-6 py-4 border-t border-gray-200 bg-gray-50", children: _jsxs("div", { className: "flex items-center justify-between text-sm text-gray-600", children: [_jsxs("span", { children: ["Menampilkan ", sortedProducts.length, " dari ", products.length, " produk"] }), _jsxs("div", { className: "flex space-x-6", children: [_jsxs("span", { children: ["Total Qty: ", sortedProducts.reduce((sum, p) => sum + p.quantitySold, 0).toLocaleString('id-ID')] }), _jsxs("span", { children: ["Total Revenue: Rp ", sortedProducts.reduce((sum, p) => sum + p.revenue, 0).toLocaleString('id-ID')] })] })] }) })] }));
};
export default ProductPerformanceTable;
//# sourceMappingURL=ProductPerformanceTable.js.map