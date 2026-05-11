import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { XMarkIcon, PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { stockSyncApi } from '@/services/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import CreateSyncRuleModal from './CreateSyncRuleModal';
import { cn } from '@/utils/cn';
const SyncRulesModal = ({ onClose, isOpen }) => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedRule, setSelectedRule] = useState(null);
    const queryClient = useQueryClient();
    // Fetch sync rules
    const { data: rulesData, isLoading } = useQuery({
        queryKey: ['sync-rules-modal'],
        queryFn: () => stockSyncApi.getRules({ page: 1, limit: 100 })
    });
    // Delete rule mutation
    const deleteRuleMutation = useMutation({
        mutationFn: stockSyncApi.deleteRule,
        onSuccess: () => {
            toast.success('Aturan sync berhasil dihapus');
            queryClient.invalidateQueries(['sync-rules-modal']);
            queryClient.invalidateQueries(['sync-rules']);
            onRuleChange();
        },
        onError: (error) => {
            toast.error(error.message || 'Gagal menghapus aturan sync');
        }
    });
    // Toggle rule status mutation
    const toggleRuleMutation = useMutation({
        mutationFn: ({ id, isActive }) => stockSyncApi.updateRule(id, { isActive }),
        onSuccess: () => {
            toast.success('Status aturan sync berhasil diubah');
            queryClient.invalidateQueries(['sync-rules-modal']);
            queryClient.invalidateQueries(['sync-rules']);
            onRuleChange();
        },
        onError: (error) => {
            toast.error(error.message || 'Gagal mengubah status aturan sync');
        }
    });
    const rules = rulesData?.data?.rules || [];
    const handleDeleteRule = (ruleId) => {
        if (confirm('Apakah Anda yakin ingin menghapus aturan sync ini?')) {
            deleteRuleMutation.mutate(ruleId);
        }
    };
    const handleToggleRule = (rule) => {
        toggleRuleMutation.mutate({
            id: rule.id,
            isActive: !rule.isActive
        });
    };
    const getSyncStrategyLabel = (strategy) => {
        const labels = {
            'EXACT_MATCH': 'Sama Persis',
            'PERCENTAGE': 'Persentase',
            'FIXED_OFFSET': 'Offset Tetap',
            'MINIMUM_THRESHOLD': 'Minimum Threshold',
            'CUSTOM_FORMULA': 'Formula Kustom'
        };
        return labels[strategy] || strategy;
    };
    const getSyncScopeLabel = (scope) => {
        const labels = {
            'ALL_PRODUCTS': 'Semua Produk',
            'SPECIFIC_PRODUCTS': 'Produk Tertentu',
            'CATEGORY': 'Kategori'
        };
        return labels[scope] || scope;
    };
    return (_jsxs("div", { className: "fixed inset-0 z-50 overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0", children: [_jsx("div", { className: "fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity", onClick: onClose }), _jsx("div", { className: "inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full", children: _jsxs("div", { className: "bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Aturan Sinkronisasi Stok" }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("button", { onClick: () => setShowCreateModal(true), className: "btn btn-primary btn-sm", children: [_jsx(PlusIcon, { className: "h-4 w-4 mr-2" }), "Tambah Aturan"] }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600", children: _jsx(XMarkIcon, { className: "h-6 w-6" }) })] })] }), _jsx("div", { className: "max-h-96 overflow-y-auto", children: isLoading ? (_jsx("div", { className: "flex items-center justify-center h-32", children: _jsx(LoadingSpinner, { size: "md", text: "Memuat aturan sync..." }) })) : rules.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "mx-auto h-12 w-12 text-gray-400", children: _jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1, d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" }) }) }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "Belum ada aturan sync" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Buat aturan sync pertama untuk otomatisasi stok" }), _jsxs("button", { onClick: () => setShowCreateModal(true), className: "mt-4 btn btn-primary btn-sm", children: [_jsx(PlusIcon, { className: "h-4 w-4 mr-2" }), "Tambah Aturan"] })] })) : (_jsx("div", { className: "space-y-4", children: rules.map((rule) => (_jsx("div", { className: "border border-gray-200 rounded-lg p-4 hover:bg-gray-50", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("h4", { className: "text-sm font-medium text-gray-900", children: rule.name }), _jsxs("span", { className: cn('inline-flex items-center px-2 py-1 rounded-full text-xs font-medium', rule.isActive
                                                                            ? 'bg-green-100 text-green-800'
                                                                            : 'bg-gray-100 text-gray-800'), children: [rule.isActive ? (_jsx(CheckCircleIcon, { className: "h-3 w-3 mr-1" })) : (_jsx(XCircleIcon, { className: "h-3 w-3 mr-1" })), rule.isActive ? 'Aktif' : 'Nonaktif'] })] }), rule.description && (_jsx("p", { className: "text-sm text-gray-500 mt-1", children: rule.description })), _jsxs("div", { className: "flex items-center space-x-4 mt-2 text-xs text-gray-500", children: [_jsxs("span", { children: ["Strategi: ", getSyncStrategyLabel(rule.syncStrategy)] }), _jsx("span", { children: "\u2022" }), _jsxs("span", { children: ["Scope: ", getSyncScopeLabel(rule.syncScope)] }), _jsx("span", { children: "\u2022" }), _jsxs("span", { children: ["Target: ", rule.targetMarketplaceAccounts?.length || 0, " marketplace"] })] }), _jsxs("div", { className: "mt-2 text-xs text-gray-600", children: [rule.syncStrategy === 'PERCENTAGE' && rule.syncPercentage && (_jsxs("span", { children: ["Persentase: ", rule.syncPercentage, "%"] })), rule.syncStrategy === 'FIXED_OFFSET' && rule.syncOffset !== null && (_jsxs("span", { children: ["Offset: ", rule.syncOffset > 0 ? '+' : '', rule.syncOffset] })), rule.syncStrategy === 'MINIMUM_THRESHOLD' && rule.minimumStock && (_jsxs("span", { children: ["Minimum: ", rule.minimumStock] })), rule.syncStrategy === 'CUSTOM_FORMULA' && rule.customFormula && (_jsxs("span", { children: ["Formula: ", rule.customFormula] }))] }), rule.targetMarketplaceAccounts && rule.targetMarketplaceAccounts.length > 0 && (_jsx("div", { className: "mt-2", children: _jsx("div", { className: "flex flex-wrap gap-1", children: rule.targetMarketplaceAccounts.map((target, index) => (_jsx("span", { className: "inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800", children: target.marketplaceAccount?.marketplace?.name }, index))) }) }))] }), _jsxs("div", { className: "flex items-center space-x-2 ml-4", children: [_jsx("button", { onClick: () => handleToggleRule(rule), disabled: toggleRuleMutation.isLoading, className: cn('p-2 rounded-md text-sm', rule.isActive
                                                                    ? 'text-red-600 hover:bg-red-50'
                                                                    : 'text-green-600 hover:bg-green-50'), title: rule.isActive ? 'Nonaktifkan' : 'Aktifkan', children: rule.isActive ? (_jsx(XCircleIcon, { className: "h-4 w-4" })) : (_jsx(CheckCircleIcon, { className: "h-4 w-4" })) }), _jsx("button", { onClick: () => {
                                                                    setSelectedRule(rule);
                                                                    setShowCreateModal(true);
                                                                }, className: "p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md", title: "Edit", children: _jsx(PencilIcon, { className: "h-4 w-4" }) }), _jsx("button", { onClick: () => handleDeleteRule(rule.id), disabled: deleteRuleMutation.isLoading, className: "p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md", title: "Hapus", children: _jsx(TrashIcon, { className: "h-4 w-4" }) })] })] }) }, rule.id))) })) })] }) })] }), showCreateModal && (_jsx(CreateSyncRuleModal, { rule: selectedRule, onClose: () => {
                    setShowCreateModal(false);
                    setSelectedRule(null);
                }, onSuccess: () => {
                    queryClient.invalidateQueries(['sync-rules-modal']);
                    queryClient.invalidateQueries(['sync-rules']);
                    onRuleChange();
                    setShowCreateModal(false);
                    setSelectedRule(null);
                } }))] }));
};
export default SyncRulesModal;
//# sourceMappingURL=SyncRulesModal.js.map