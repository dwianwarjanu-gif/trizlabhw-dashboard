import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, ArrowPathIcon, CloudArrowUpIcon, EyeIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';
const MarketplaceCard = ({ account, onTestConnection, onSyncProducts, onViewDetails, isTestingConnection = false, isSyncingProducts = false }) => {
    const getStatusIcon = () => {
        if (!account.isConnected) {
            return _jsx(XCircleIcon, { className: "h-5 w-5 text-red-500" });
        }
        switch (account.connectionStatus) {
            case 'ACTIVE':
                return _jsx(CheckCircleIcon, { className: "h-5 w-5 text-green-500" });
            case 'ERROR':
                return _jsx(ExclamationTriangleIcon, { className: "h-5 w-5 text-red-500" });
            case 'PENDING':
                return _jsx(ArrowPathIcon, { className: "h-5 w-5 text-yellow-500 animate-spin" });
            default:
                return _jsx(CheckCircleIcon, { className: "h-5 w-5 text-green-500" });
        }
    };
    const getStatusText = () => {
        if (!account.isConnected) {
            return 'Terputus';
        }
        switch (account.connectionStatus) {
            case 'ACTIVE':
                return 'Terhubung';
            case 'ERROR':
                return 'Error';
            case 'PENDING':
                return 'Menghubungkan...';
            default:
                return 'Terhubung';
        }
    };
    const getStatusColor = () => {
        if (!account.isConnected) {
            return 'text-red-600';
        }
        switch (account.connectionStatus) {
            case 'ACTIVE':
                return 'text-green-600';
            case 'ERROR':
                return 'text-red-600';
            case 'PENDING':
                return 'text-yellow-600';
            default:
                return 'text-green-600';
        }
    };
    return (_jsxs("div", { className: "bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow", children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "flex-shrink-0", children: account.marketplace.logo ? (_jsx("img", { src: account.marketplace.logo, alt: account.marketplace.name, className: "h-10 w-10 object-contain" })) : (_jsx("div", { className: "h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center", children: _jsx("span", { className: "text-lg font-bold text-gray-600", children: account.marketplace.name.charAt(0) }) })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 truncate", children: account.marketplace.name }), _jsx("p", { className: "text-sm text-gray-500 truncate", children: account.storeName })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [getStatusIcon(), _jsx("span", { className: cn('text-sm font-medium', getStatusColor()), children: getStatusText() })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-4", children: [_jsxs("div", { className: "text-center p-3 bg-gray-50 rounded-lg", children: [_jsx("div", { className: "text-2xl font-bold text-gray-900", children: account._count?.marketplaceProducts || 0 }), _jsx("div", { className: "text-xs text-gray-500", children: "Produk Tersync" })] }), _jsxs("div", { className: "text-center p-3 bg-gray-50 rounded-lg", children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: account.lastSynced ? (new Date(account.lastSynced).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short'
                                })) : ('Belum pernah') }), _jsx("div", { className: "text-xs text-gray-500", children: "Sync Terakhir" })] })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsxs("button", { onClick: onTestConnection, disabled: isTestingConnection, className: "flex-1 btn btn-outline btn-sm", children: [isTestingConnection ? (_jsx(ArrowPathIcon, { className: "h-4 w-4 mr-2 animate-spin" })) : (_jsx(CheckCircleIcon, { className: "h-4 w-4 mr-2" })), "Test Koneksi"] }), _jsxs("button", { onClick: onSyncProducts, disabled: isSyncingProducts || !account.isConnected, className: "flex-1 btn btn-primary btn-sm", children: [isSyncingProducts ? (_jsx(ArrowPathIcon, { className: "h-4 w-4 mr-2 animate-spin" })) : (_jsx(CloudArrowUpIcon, { className: "h-4 w-4 mr-2" })), "Sync Produk"] })] }), _jsxs("div", { className: "flex justify-between mt-3 pt-3 border-t border-gray-100", children: [_jsxs("button", { onClick: onViewDetails, className: "text-sm text-gray-500 hover:text-gray-700 flex items-center", children: [_jsx(EyeIcon, { className: "h-4 w-4 mr-1" }), "Lihat Detail"] }), _jsxs("button", { className: "text-sm text-gray-500 hover:text-gray-700 flex items-center", children: [_jsx(Cog6ToothIcon, { className: "h-4 w-4 mr-1" }), "Pengaturan"] })] }), !account.isConnected && (_jsx("div", { className: "mt-3 p-3 bg-red-50 border border-red-200 rounded-lg", children: _jsxs("div", { className: "flex items-center", children: [_jsx(ExclamationTriangleIcon, { className: "h-4 w-4 text-red-400 mr-2" }), _jsx("span", { className: "text-sm text-red-700", children: "Koneksi terputus. Periksa kredensial API." })] }) })), account.isConnected && account.lastSynced && (_jsxs("div", { className: "mt-3 text-xs text-gray-500 text-center", children: ["Terakhir disinkronkan: ", new Date(account.lastSynced).toLocaleString('id-ID')] }))] }));
};
export default MarketplaceCard;
//# sourceMappingURL=MarketplaceCard.js.map