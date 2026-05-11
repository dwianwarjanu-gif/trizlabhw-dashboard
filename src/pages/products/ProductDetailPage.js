import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon, ArrowsUpDownIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { productsApi } from '@/services/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Pagination from '@/components/ui/Pagination';
import ProductCard from '@/components/products/ProductCard';
import ProductFilters from '@/components/products/ProductFilters';
import { cn } from '@/utils/cn';
const ProductPage = () => {
    const { id } = useParams();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        categoryId: '',
        isActive: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
    });
    const [viewMode, setViewMode] = useState('grid');
    const [showFilters, setShowFilters] = useState(false);
    const { data: productsData, isLoading, error } = useQuery({
        queryKey: ['products', page, search, filters],
        queryFn: () => productsApi.getAll({
            page,
            limit: 12,
            search,
            ...filters
        }),
        keepPreviousData: true
    });
    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
    };
    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setPage(1);
    };
    const products = productsData?.data?.products || [];
    const pagination = productsData?.data?.pagination;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Produk" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Kelola semua produk Anda di sini" })] }), _jsx("div", { className: "mt-4 sm:mt-0", children: _jsxs(Link, { to: "/products/create", className: "btn btn-primary btn-md", children: [_jsx(PlusIcon, { className: "h-5 w-5 mr-2" }), "Tambah Produk"] }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-soft p-6", children: [_jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4", children: [_jsx("form", { onSubmit: handleSearch, className: "flex-1 max-w-lg", children: _jsxs("div", { className: "relative", children: [_jsx(MagnifyingGlassIcon, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Cari produk, SKU, atau nama...", value: search, onChange: (e) => setSearch(e.target.value), className: "input pl-10 w-full" })] }) }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("div", { className: "flex rounded-md shadow-sm", children: [_jsx("button", { type: "button", onClick: () => setViewMode('grid'), className: cn('px-3 py-2 text-sm font-medium rounded-l-md border', viewMode === 'grid'
                                                    ? 'bg-primary-50 border-primary-200 text-primary-700'
                                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'), children: "Grid" }), _jsx("button", { type: "button", onClick: () => setViewMode('list'), className: cn('px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b', viewMode === 'list'
                                                    ? 'bg-primary-50 border-primary-200 text-primary-700'
                                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'), children: "List" })] }), _jsxs("select", { value: `${filters.sortBy}-${filters.sortOrder}`, onChange: (e) => {
                                            const [sortBy, sortOrder] = e.target.value.split('-');
                                            handleFilterChange({ sortBy, sortOrder });
                                        }, className: "input text-sm", children: [_jsx("option", { value: "createdAt-desc", children: "Terbaru" }), _jsx("option", { value: "createdAt-asc", children: "Terlama" }), _jsx("option", { value: "name-asc", children: "Nama A-Z" }), _jsx("option", { value: "name-desc", children: "Nama Z-A" }), _jsx("option", { value: "price-asc", children: "Harga Terendah" }), _jsx("option", { value: "price-desc", children: "Harga Tertinggi" })] }), _jsxs("button", { type: "button", onClick: () => setShowFilters(!showFilters), className: cn('btn btn-outline btn-md', showFilters && 'bg-gray-50'), children: [_jsx(FunnelIcon, { className: "h-5 w-5 mr-2" }), "Filter"] })] })] }), showFilters && (_jsx("div", { className: "mt-6 pt-6 border-t border-gray-200", children: _jsx(ProductFilters, { filters: filters, onFilterChange: handleFilterChange }) }))] }), _jsx("div", { className: "bg-white rounded-lg shadow-soft", children: isLoading ? (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(LoadingSpinner, { size: "lg", text: "Memuat produk..." }) })) : error ? (_jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-gray-500", children: "Terjadi kesalahan saat memuat produk" }) })) : products.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "mx-auto h-12 w-12 text-gray-400", children: _jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1, d: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" }) }) }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "Belum ada produk" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Mulai dengan menambahkan produk pertama Anda." }), _jsx("div", { className: "mt-6", children: _jsxs(Link, { to: "/products/create", className: "btn btn-primary btn-md", children: [_jsx(PlusIcon, { className: "h-5 w-5 mr-2" }), "Tambah Produk"] }) })] })) : (_jsxs("div", { className: "p-6", children: [viewMode === 'grid' ? (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6", children: products.map((product) => (_jsx(ProductCard, { product: product }, product.id))) })) : (_jsx("div", { className: "space-y-4", children: products.map((product) => (_jsxs("div", { className: "flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "flex-shrink-0", children: product.images && product.images.length > 0 ? (_jsx("img", { src: product.images[0], alt: product.name, className: "h-12 w-12 rounded-lg object-cover" })) : (_jsx("div", { className: "h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center", children: _jsx("span", { className: "text-gray-400 text-xs", children: "No Image" }) })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 truncate", children: product.name }), _jsxs("p", { className: "text-sm text-gray-500", children: ["SKU: ", product.sku] }), _jsxs("div", { className: "flex items-center space-x-4 mt-1", children: [_jsxs("span", { className: "text-sm font-medium text-gray-900", children: ["Rp ", product.price?.toLocaleString('id-ID')] }), _jsxs("span", { className: "text-sm text-gray-500", children: ["Stok: ", product.inventory?.stockQuantity || 0] }), _jsx("span", { className: cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', product.isActive
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-red-100 text-red-800'), children: product.isActive ? 'Aktif' : 'Nonaktif' })] })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Link, { to: `/products/${product.id}`, className: "p-2 text-gray-400 hover:text-gray-600", children: _jsx(EyeIcon, { className: "h-5 w-5" }) }), _jsx(Link, { to: `/products/${product.id}/edit`, className: "p-2 text-gray-400 hover:text-gray-600", children: _jsx(PencilIcon, { className: "h-5 w-5" }) }), _jsx("button", { type: "button", className: "p-2 text-gray-400 hover:text-red-600", children: _jsx(TrashIcon, { className: "h-5 w-5" }) })] })] }, product.id))) })), pagination && pagination.totalPages > 1 && (_jsx("div", { className: "mt-8", children: _jsx(Pagination, { currentPage: pagination.page, totalPages: pagination.totalPages, onPageChange: setPage }) }))] })) })] }));
};
import { useParams } from "react-router-dom";
export default function ProductPage() {
    return (_jsxs("div", { style: { padding: 20 }, children: [_jsx("h2", { children: "Product Detail" }), _jsxs("p", { children: ["Product ID: ", id] })] }));
}
//# sourceMappingURL=ProductDetailPage.js.map