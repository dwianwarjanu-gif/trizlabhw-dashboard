import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { CheckIcon, XMarkIcon, TagIcon, UserIcon, DocumentArrowDownIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ordersApi } from '@/services/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn } from '@/utils/cn';
const OrderBulkActions = ({ selectedOrders, onClearSelection, onRefresh }) => {
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [showTagMenu, setShowTagMenu] = useState(false);
    const [showAssignMenu, setShowAssignMenu] = useState(false);
    const queryClient = useQueryClient();
    // Bulk status update mutation
    const bulkStatusMutation = useMutation({
        mutationFn: async ({ status, reason }) => {
            const promises = selectedOrders.map(orderId => ordersApi.updateStatus(orderId, status, reason));
            return Promise.all(promises);
        },
        onSuccess: () => {
            toast.success(`${selectedOrders.length} pesanan berhasil diperbarui`);
            queryClient.invalidateQueries(['orders']);
            onClearSelection();
            onRefresh();
        },
        onError: (error) => {
            toast.error(error.message || 'Gagal memperbarui pesanan');
        }
    });
    // Bulk tag mutation
    const bulkTagMutation = useMutation({
        mutationFn: async (tag) => {
            const promises = selectedOrders.map(orderId => ordersApi.addTag(orderId, tag));
            return Promise.all(promises);
        },
        onSuccess: () => {
            toast.success(`Tag berhasil ditambahkan ke ${selectedOrders.length} pesanan`);
            queryClient.invalidateQueries(['orders']);
            onClearSelection();
        },
        onError: (error) => {
            toast.error(error.message || 'Gagal menambahkan tag');
        }
    });
    // Bulk assign mutation
    const bulkAssignMutation = useMutation({
        mutationFn: async (userId) => {
            const promises = selectedOrders.map(orderId => ordersApi.assignOrder(orderId, userId));
            return Promise.all(promises);
        },
        onSuccess: () => {
            toast.success(`${selectedOrders.length} pesanan berhasil ditugaskan`);
            queryClient.invalidateQueries(['orders']);
            onClearSelection();
        },
        onError: (error) => {
            toast.error(error.message || 'Gagal menugaskan pesanan');
        }
    });
    const handleStatusUpdate = (status) => {
        const reason = `Bulk update to ${status}`;
        bulkStatusMutation.mutate({ status, reason });
        setShowStatusMenu(false);
    };
    const handleTagAdd = (tag) => {
        bulkTagMutation.mutate(tag);
        setShowTagMenu(false);
    };
    const handleAssign = (userId) => {
        bulkAssignMutation.mutate(userId);
        setShowAssignMenu(false);
    };
    const handleExport = () => {
        // Implement export functionality
        toast.info('Fitur export akan segera tersedia');
    };
    const handleDelete = () => {
        if (confirm(`Apakah Anda yakin ingin menghapus ${selectedOrders.length} pesanan?`)) {
            // Implement delete functionality
            toast.info('Fitur hapus akan segera tersedia');
        }
    };
    const isLoading = bulkStatusMutation.isLoading || bulkTagMutation.isLoading || bulkAssignMutation.isLoading;
    if (selectedOrders.length === 0) {
        return null;
    }
    return (_jsx("div", { className: "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40", children: _jsx("div", { className: "bg-white rounded-lg shadow-lg border border-gray-200 p-4", children: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(CheckIcon, { className: "h-5 w-5 text-primary-600" }), _jsxs("span", { className: "text-sm font-medium text-gray-900", children: [selectedOrders.length, " pesanan dipilih"] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: () => setShowStatusMenu(!showStatusMenu), disabled: isLoading, className: "btn btn-outline btn-sm", children: [isLoading && bulkStatusMutation.isLoading ? (_jsx(LoadingSpinner, { size: "sm" })) : (_jsx(ArrowPathIcon, { className: "h-4 w-4 mr-2" })), "Status"] }), showStatusMenu && (_jsx("div", { className: "absolute bottom-full mb-2 left-0 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50", children: [
                                            { value: 'CONFIRMED', label: 'Konfirmasi' },
                                            { value: 'PROCESSING', label: 'Proses' },
                                            { value: 'SHIPPED', label: 'Kirim' },
                                            { value: 'DELIVERED', label: 'Selesai' },
                                            { value: 'CANCELLED', label: 'Batal' }
                                        ].map((status) => (_jsx("button", { onClick: () => handleStatusUpdate(status.value), className: "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100", children: status.label }, status.value))) }))] }), _jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: () => setShowTagMenu(!showTagMenu), disabled: isLoading, className: "btn btn-outline btn-sm", children: [isLoading && bulkTagMutation.isLoading ? (_jsx(LoadingSpinner, { size: "sm" })) : (_jsx(TagIcon, { className: "h-4 w-4 mr-2" })), "Tag"] }), showTagMenu && (_jsx("div", { className: "absolute bottom-full mb-2 left-0 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50", children: [
                                            'Prioritas Tinggi',
                                            'Perlu Review',
                                            'Komplain',
                                            'VIP Customer',
                                            'Promo'
                                        ].map((tag) => (_jsx("button", { onClick: () => handleTagAdd(tag), className: "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100", children: tag }, tag))) }))] }), _jsxs("button", { onClick: () => setShowAssignMenu(!showAssignMenu), disabled: isLoading, className: "btn btn-outline btn-sm", children: [isLoading && bulkAssignMutation.isLoading ? (_jsx(LoadingSpinner, { size: "sm" })) : (_jsx(UserIcon, { className: "h-4 w-4 mr-2" })), "Assign"] }), _jsxs("button", { onClick: handleExport, disabled: isLoading, className: "btn btn-outline btn-sm", children: [_jsx(DocumentArrowDownIcon, { className: "h-4 w-4 mr-2" }), "Export"] }), _jsxs("button", { onClick: handleDelete, disabled: isLoading, className: "btn btn-outline btn-sm text-red-600 hover:text-red-700 hover:bg-red-50", children: [_jsx(TrashIcon, { className: "h-4 w-4 mr-2" }), "Hapus"] })] }), _jsx("button", { onClick: onClearSelection, className: "p-1 text-gray-400 hover:text-gray-600", children: _jsx(XMarkIcon, { className: "h-5 w-5" }) })] }) }) }));
};
export default OrderBulkActions;
//# sourceMappingURL=OrderBulkActions.js.map