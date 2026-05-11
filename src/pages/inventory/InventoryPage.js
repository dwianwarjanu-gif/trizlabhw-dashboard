import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MagnifyingGlassIcon, FunnelIcon, PencilIcon, ExclamationTriangleIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { inventoryApi } from '@/services/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Pagination from '@/components/ui/Pagination';
import InventoryUpdateModal from '@/components/inventory/InventoryUpdateModal';
import { cn } from '@/utils/cn';
const InventoryPage = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        lowStock: '',
        outOfStock: '',
        sortBy: 'lastUpdated',
        sortOrder: 'desc'
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const queryClient = useQueryClient();
    const { data: inventoryData, isLoading, error, refetch } = useQuery({
        queryKey: ['inventory', page, search, filters],
        queryFn: () => inventoryApi.getAll({
            page,
            limit: 20,
            search,
            ...filters
        }),
        keepPreviousData: true
    });
    const updateInventoryMutation = useMutation({
        mutationFn: inventoryApi.updateStock,
        onSuccess: () => {
            queryClient.invalidateQueries(['inventory']);
            toast.success('Stok berhasil diperbarui');
            setShowUpdateModal(false);
            setSelectedItem(null);
        },
        onError: (error) => {
            toast.error(error.message || 'Gagal memperbarui stok');
        }
    });
    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
    };
    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setPage(1);
    };
    const handleUpdateStock = (item) => {
        setSelectedItem(item);
        setShowUpdateModal(true);
    };
    const handleUpdateSubmit = (updates) => {
        if (selectedItem) {
            updateInventoryMutation.mutate({
                productId: selectedItem.productId,
                updates: [{
                        variantId: selectedItem.variantId,
                        stockQuantity: updates.stockQuantity,
                        minStockLevel: updates.minStockLevel,
                        reason: updates.reason
                    }]
            });
        }
    };
    const inventory = inventoryData?.data?.inventory || [];
    const pagination = inventoryData?.data?.pagination;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Inventori" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Kelola stok produk dan pantau ketersediaan" })] }), _jsx("div", { className: "mt-4 sm:mt-0", children: _jsxs("button", { onClick: () => refetch(), className: "btn btn-outline btn-md", children: [_jsx(ArrowPathIcon, { className: "h-5 w-5 mr-2" }), "Refresh"] }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-soft p-6", children: [_jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4", children: [_jsx("form", { onSubmit: handleSearch, className: "flex-1 max-w-lg", children: _jsxs("div", { className: "relative", children: [_jsx(MagnifyingGlassIcon, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Cari produk, SKU, atau nama...", value: search, onChange: (e) => setSearch(e.target.value), className: "input pl-10 w-full" })] }) }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { type: "button", onClick: () => handleFilterChange({ lowStock: 'true', outOfStock: '' }), className: cn('btn btn-sm', filters.lowStock === 'true' ? 'btn-primary' : 'btn-outline'), children: "Stok Rendah" }), _jsx("button", { type: "button", onClick: () => handleFilterChange({ outOfStock: 'true', lowStock: '' }), className: cn('btn btn-sm', filters.outOfStock === 'true' ? 'btn-primary' : 'btn-outline'), children: "Habis" })] }), _jsxs("select", { value: `${filters.sortBy}-${filters.sortOrder}`, onChange: (e) => {
                                            const [sortBy, sortOrder] = e.target.value.split('-');
                                            handleFilterChange({ sortBy, sortOrder });
                                        }, className: "input text-sm", children: [_jsx("option", { value: "lastUpdated-desc", children: "Terakhir Diperbarui" }), _jsx("option", { value: "stockQuantity-asc", children: "Stok Terendah" }), _jsx("option", { value: "stockQuantity-desc", children: "Stok Tertinggi" }), _jsx("option", { value: "product.name-asc", children: "Nama A-Z" })] }), _jsxs("button", { type: "button", onClick: () => setShowFilters(!showFilters), className: cn('btn btn-outline btn-md', showFilters && 'bg-gray-50'), children: [_jsx(FunnelIcon, { className: "h-5 w-5 mr-2" }), "Filter"] })] })] }), showFilters && (_jsx("div", { className: "mt-6 pt-6 border-t border-gray-200", children: _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Status Stok" }), _jsxs("select", { value: filters.lowStock || filters.outOfStock || '', onChange: (e) => {
                                            if (e.target.value === 'low') {
                                                handleFilterChange({ lowStock: 'true', outOfStock: '' });
                                            }
                                            else if (e.target.value === 'out') {
                                                handleFilterChange({ outOfStock: 'true', lowStock: '' });
                                            }
                                            else {
                                                handleFilterChange({ lowStock: '', outOfStock: '' });
                                            }
                                        }, className: "input text-sm w-full", children: [_jsx("option", { value: "", children: "Semua" }), _jsx("option", { value: "low", children: "Stok Rendah" }), _jsx("option", { value: "out", children: "Habis" })] })] }) }) }))] }), _jsx("div", { className: "bg-white rounded-lg shadow-soft", children: isLoading ? (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(LoadingSpinner, { size: "lg", text: "Memuat inventori..." }) })) : error ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(ExclamationTriangleIcon, { className: "mx-auto h-12 w-12 text-red-400" }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "Error memuat data" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Terjadi kesalahan saat memuat inventori." }), _jsx("button", { onClick: () => refetch(), className: "mt-4 btn btn-primary btn-sm", children: "Coba Lagi" })] })) : inventory.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "mx-auto h-12 w-12 text-gray-400", children: _jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1, d: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" }) }) }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "Belum ada inventori" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Inventori akan muncul setelah Anda menambahkan produk." })] })) : (_jsxs("div", { className: "overflow-hidden", children: [_jsx("div", { className: "bg-gray-50 px-6 py-3 border-b border-gray-200", children: _jsxs("div", { className: "grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider", children: [_jsx("div", { className: "col-span-4", children: "Produk" }), _jsx("div", { className: "col-span-2", children: "Stok Saat Ini" }), _jsx("div", { className: "col-span-2", children: "Stok Tersedia" }), _jsx("div", { className: "col-span-2", children: "Min. Stok" }), _jsx("div", { className: "col-span-1", children: "Status" }), _jsx("div", { className: "col-span-1", children: "Aksi" })] }) }), _jsx("div", { className: "divide-y divide-gray-200", children: inventory.map((item) => {
                                const isLowStock = item.stockQuantity <= item.minStockLevel;
                                const isOutOfStock = item.stockQuantity <= 0;
                                return (_jsx("div", { className: "px-6 py-4 hover:bg-gray-50", children: _jsxs("div", { className: "grid grid-cols-12 gap-4 items-center", children: [_jsx("div", { className: "col-span-4", children: _jsxs("div", { className: "flex items-center space-x-3", children: [item.product?.images && item.product.images.length > 0 ? (_jsx("img", { src: item.product.images[0], alt: item.product.name, className: "h-10 w-10 rounded-lg object-cover" })) : (_jsx("div", { className: "h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center", children: _jsx("span", { className: "text-gray-400 text-xs", children: "No Image" }) })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("p", { className: "text-sm font-medium text-gray-900 truncate", children: [item.product?.name, item.variant && (_jsxs("span", { className: "text-gray-500 ml-1", children: ["- ", item.variant.variantName] }))] }), _jsxs("p", { className: "text-sm text-gray-500", children: ["SKU: ", item.variant?.sku || item.product?.sku] })] })] }) }), _jsx("div", { className: "col-span-2", children: _jsx("span", { className: cn('text-sm font-medium', isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-gray-900'), children: item.stockQuantity }) }), _jsx("div", { className: "col-span-2", children: _jsx("span", { className: "text-sm text-gray-900", children: item.availableQuantity }) }), _jsx("div", { className: "col-span-2", children: _jsx("span", { className: "text-sm text-gray-500", children: item.minStockLevel }) }), _jsx("div", { className: "col-span-1", children: isOutOfStock ? (_jsx("span", { className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800", children: "Habis" })) : isLowStock ? (_jsxs("span", { className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800", children: [_jsx(ExclamationTriangleIcon, { className: "h-3 w-3 mr-1" }), "Rendah"] })) : (_jsxs("span", { className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800", children: [_jsx(CheckCircleIcon, { className: "h-3 w-3 mr-1" }), "Aman"] })) }), _jsx("div", { className: "col-span-1", children: _jsx("button", { onClick: () => handleUpdateStock(item), className: "text-primary-600 hover:text-primary-500", title: "Update Stok", children: _jsx(PencilIcon, { className: "h-5 w-5" }) }) })] }) }, `${item.productId}-${item.variantId || 'main'}`));
                            }) }), pagination && pagination.totalPages > 1 && (_jsx("div", { className: "px-6 py-4 border-t border-gray-200", children: _jsx(Pagination, { currentPage: pagination.page, totalPages: pagination.totalPages, onPageChange: setPage }) }))] })) }), showUpdateModal && selectedItem && (_jsx(InventoryUpdateModal, { item: selectedItem, onClose: () => {
                    setShowUpdateModal(false);
                    setSelectedItem(null);
                }, onSubmit: handleUpdateSubmit, isLoading: updateInventoryMutation.isLoading }))] }));
};
export default InventoryPage;
//# sourceMappingURL=InventoryPage.js.map