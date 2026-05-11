import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
const updateSchema = z.object({
    stockQuantity: z.number().min(0, 'Stok tidak boleh negatif'),
    minStockLevel: z.number().min(0, 'Minimum stok tidak boleh negatif'),
    reason: z.string().min(1, 'Alasan harus diisi').max(255, 'Alasan terlalu panjang')
});
const InventoryUpdateModal = ({ item, onClose, onSubmit, isLoading }) => {
    const { register, handleSubmit, formState: { errors }, watch } = useForm({
        resolver: zodResolver(updateSchema),
        defaultValues: {
            stockQuantity: item.stockQuantity,
            minStockLevel: item.minStockLevel,
            reason: ''
        }
    });
    const currentStock = watch('stockQuantity');
    const stockDifference = currentStock - item.stockQuantity;
    const handleFormSubmit = (data) => {
        onSubmit(data);
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 overflow-y-auto", children: _jsxs("div", { className: "flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0", children: [_jsx("div", { className: "fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity", onClick: onClose }), _jsx("div", { className: "inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full", children: _jsxs("div", { className: "bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Update Stok Produk" }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600", children: _jsx(XMarkIcon, { className: "h-6 w-6" }) })] }), _jsxs("div", { className: "mb-6 p-4 bg-gray-50 rounded-lg", children: [_jsxs("h4", { className: "font-medium text-gray-900", children: [item.product.name, item.variant && (_jsxs("span", { className: "text-gray-500 ml-1", children: ["- ", item.variant.variantName] }))] }), _jsxs("p", { className: "text-sm text-gray-500 mt-1", children: ["SKU: ", item.variant?.sku || item.product.sku] }), _jsxs("p", { className: "text-sm text-gray-500", children: ["Stok saat ini: ", _jsx("span", { className: "font-medium", children: item.stockQuantity })] })] }), _jsxs("form", { onSubmit: handleSubmit(handleFormSubmit), className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Stok Baru" }), _jsx("input", { ...register('stockQuantity', { valueAsNumber: true }), type: "number", min: "0", className: `input w-full ${errors.stockQuantity ? 'input-error' : ''}`, placeholder: "Masukkan jumlah stok baru" }), errors.stockQuantity && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.stockQuantity.message })), stockDifference !== 0 && (_jsx("div", { className: "mt-2 text-sm", children: stockDifference > 0 ? (_jsxs("span", { className: "text-green-600", children: ["+", stockDifference, " (Penambahan stok)"] })) : (_jsxs("span", { className: "text-red-600", children: [stockDifference, " (Pengurangan stok)"] })) }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Minimum Stok" }), _jsx("input", { ...register('minStockLevel', { valueAsNumber: true }), type: "number", min: "0", className: `input w-full ${errors.minStockLevel ? 'input-error' : ''}`, placeholder: "Masukkan minimum stok" }), errors.minStockLevel && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.minStockLevel.message })), _jsx("p", { className: "mt-1 text-xs text-gray-500", children: "Sistem akan memberikan peringatan jika stok di bawah nilai ini" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Alasan Perubahan" }), _jsxs("select", { ...register('reason'), className: `input w-full ${errors.reason ? 'input-error' : ''}`, children: [_jsx("option", { value: "", children: "Pilih alasan" }), _jsx("option", { value: "Restock", children: "Restock" }), _jsx("option", { value: "Penjualan", children: "Penjualan" }), _jsx("option", { value: "Rusak/Hilang", children: "Rusak/Hilang" }), _jsx("option", { value: "Retur", children: "Retur" }), _jsx("option", { value: "Koreksi Stok", children: "Koreksi Stok" }), _jsx("option", { value: "Lainnya", children: "Lainnya" })] }), errors.reason && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.reason.message }))] }), watch('reason') === 'Lainnya' && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Alasan Lainnya" }), _jsx("input", { ...register('reason'), type: "text", className: "input w-full", placeholder: "Masukkan alasan lainnya" })] })), _jsxs("div", { className: "flex justify-end space-x-3 pt-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "btn btn-outline btn-md", disabled: isLoading, children: "Batal" }), _jsx("button", { type: "submit", className: "btn btn-primary btn-md", disabled: isLoading, children: isLoading ? (_jsx(LoadingSpinner, { size: "sm" })) : ('Update Stok') })] })] })] }) })] }) }));
};
export default InventoryUpdateModal;
//# sourceMappingURL=InventoryUpdateModal.js.map