import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, Cog6ToothIcon, ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, LinkIcon, EyeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { marketplacesApi, stockSyncApi } from '@/services/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import MarketplaceCard from '@/components/marketplaces/MarketplaceCard';
import ConnectMarketplaceModal from '@/components/marketplaces/ConnectMarketplaceModal';
import SyncRulesModal from '@/components/marketplaces/SyncRulesModal';
import SyncStatsCard from '@/components/marketplaces/SyncStatsCard';
import { cn } from '@/utils/cn';
const MarketplacesPage = () => {
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [showSyncRulesModal, setShowSyncRulesModal] = useState(false);
    const [selectedMarketplace, setSelectedMarketplace] = useState(null);
    const queryClient = useQueryClient();
    // Fetch marketplace accounts
    const { data: accountsData, isLoading: accountsLoading } = useQuery({
        queryKey: ['marketplace-accounts'],
        queryFn: marketplacesApi.getAccounts
    });
    // Fetch available marketplaces
    const { data: marketplacesData, isLoading: marketplacesLoading } = useQuery({
        queryKey: ['available-marketplaces'],
        queryFn: marketplacesApi.getAvailable
    });
    // Fetch sync rules
    const { data: syncRulesData, isLoading: syncRulesLoading } = useQuery({
        queryKey: ['sync-rules'],
        queryFn: () => stockSyncApi.getRules({ page: 1, limit: 100 })
    });
    // Fetch sync stats
    const { data: syncStatsData } = useQuery({
        queryKey: ['sync-stats'],
        queryFn: () => stockSyncApi.getStats('24h'),
        refetchInterval: 30 * 1000 // Refetch every 30 seconds
    });
    // Test connection mutation
    const testConnectionMutation = useMutation({
        mutationFn: marketplacesApi.testConnection,
        onSuccess: (data, accountId) => {
            if (data.success) {
                toast.success('Koneksi berhasil!');
            }
            else {
                toast.error(`Koneksi gagal: ${data.message}`);
            }
            queryClient.invalidateQueries(['marketplace-accounts']);
        },
        onError: (error) => {
            toast.error(error.message || 'Gagal menguji koneksi');
        }
    });
    // Sync products mutation
    const syncProductsMutation = useMutation({
        mutationFn: ({ accountId, productIds }) => marketplacesApi.syncProducts(accountId, productIds),
        onSuccess: () => {
            toast.success('Sinkronisasi produk dimulai');
            queryClient.invalidateQueries(['sync-logs']);
        },
        onError: (error) => {
            toast.error(error.message || 'Gagal memulai sinkronisasi');
        }
    });
    const accounts = accountsData?.data?.accounts || [];
    const availableMarketplaces = marketplacesData?.data?.marketplaces || [];
    const syncRules = syncRulesData?.data?.rules || [];
    const syncStats = syncStatsData?.data?.stats;
    const connectedAccounts = accounts.filter(account => account.isConnected);
    const disconnectedAccounts = accounts.filter(account => !account.isConnected);
    const handleConnectMarketplace = (marketplace) => {
        setSelectedMarketplace(marketplace);
        setShowConnectModal(true);
    };
    const handleTestConnection = (accountId) => {
        testConnectionMutation.mutate(accountId);
    };
    const handleSyncProducts = (accountId) => {
        // For now, sync all products - in real app, let user select
        syncProductsMutation.mutate({ accountId, productIds: [] });
    };
    const handleManageSyncRules = () => {
        setShowSyncRulesModal(true);
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Marketplace" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Kelola koneksi marketplace dan aturan sinkronisasi" })] }), _jsxs("div", { className: "mt-4 sm:mt-0 flex space-x-3", children: [_jsxs("button", { onClick: handleManageSyncRules, className: "btn btn-outline btn-md", children: [_jsx(Cog6ToothIcon, { className: "h-5 w-5 mr-2" }), "Aturan Sync"] }), _jsxs("button", { onClick: () => setShowConnectModal(true), className: "btn btn-primary btn-md", children: [_jsx(PlusIcon, { className: "h-5 w-5 mr-2" }), "Hubungkan Marketplace"] })] })] }), syncStats && (_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsx(SyncStatsCard, { title: "Total Sync (24h)", value: syncStats.totalSyncs, icon: ArrowPathIcon, color: "blue" }), _jsx(SyncStatsCard, { title: "Berhasil", value: syncStats.successfulSyncs, icon: CheckCircleIcon, color: "green" }), _jsx(SyncStatsCard, { title: "Gagal", value: syncStats.failedSyncs, icon: XCircleIcon, color: "red" }), _jsx(SyncStatsCard, { title: "Success Rate", value: `${syncStats.successRate}%`, icon: CheckCircleIcon, color: "purple" })] })), _jsxs("div", { className: "bg-white rounded-lg shadow-soft p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("h2", { className: "text-lg font-medium text-gray-900", children: ["Marketplace Terhubung (", connectedAccounts.length, ")"] }), connectedAccounts.length > 0 && (_jsxs("button", { onClick: () => queryClient.invalidateQueries(['marketplace-accounts']), className: "btn btn-outline btn-sm", children: [_jsx(ArrowPathIcon, { className: "h-4 w-4 mr-2" }), "Refresh"] }))] }), accountsLoading ? (_jsx("div", { className: "flex items-center justify-center h-32", children: _jsx(LoadingSpinner, { size: "md", text: "Memuat marketplace..." }) })) : connectedAccounts.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(LinkIcon, { className: "mx-auto h-12 w-12 text-gray-400" }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "Belum ada marketplace terhubung" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Hubungkan marketplace pertama Anda untuk mulai berjualan" }), _jsxs("button", { onClick: () => setShowConnectModal(true), className: "mt-4 btn btn-primary btn-md", children: [_jsx(PlusIcon, { className: "h-5 w-5 mr-2" }), "Hubungkan Marketplace"] })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: connectedAccounts.map((account) => (_jsx(MarketplaceCard, { account: account, onTestConnection: () => handleTestConnection(account.id), onSyncProducts: () => handleSyncProducts(account.id), onViewDetails: () => { }, isTestingConnection: testConnectionMutation.isLoading, isSyncingProducts: syncProductsMutation.isLoading }, account.id))) }))] }), _jsxs("div", { className: "bg-white rounded-lg shadow-soft p-6", children: [_jsx("h2", { className: "text-lg font-medium text-gray-900 mb-6", children: "Marketplace Tersedia" }), marketplacesLoading ? (_jsx("div", { className: "flex items-center justify-center h-32", children: _jsx(LoadingSpinner, { size: "md", text: "Memuat marketplace..." }) })) : (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", children: availableMarketplaces.map((marketplace) => {
                            const isConnected = connectedAccounts.some(account => account.marketplace.code === marketplace.code);
                            return (_jsx("div", { className: cn('relative rounded-lg border-2 border-dashed p-6 hover:border-gray-400 transition-colors', isConnected ? 'border-green-300 bg-green-50' : 'border-gray-300'), children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "mx-auto h-12 w-12 flex items-center justify-center rounded-lg bg-gray-100", children: marketplace.logo ? (_jsx("img", { src: marketplace.logo, alt: marketplace.name, className: "h-8 w-8 object-contain" })) : (_jsx("span", { className: "text-lg font-bold text-gray-600", children: marketplace.name.charAt(0) })) }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: marketplace.name }), _jsx("p", { className: "mt-1 text-xs text-gray-500", children: marketplace.description }), isConnected ? (_jsx("div", { className: "mt-3", children: _jsxs("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800", children: [_jsx(CheckCircleIcon, { className: "h-3 w-3 mr-1" }), "Terhubung"] }) })) : (_jsx("button", { onClick: () => handleConnectMarketplace(marketplace), className: "mt-3 btn btn-outline btn-sm w-full", children: "Hubungkan" }))] }) }, marketplace.id));
                        }) }))] }), syncRules.length > 0 && (_jsxs("div", { className: "bg-white rounded-lg shadow-soft p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h2", { className: "text-lg font-medium text-gray-900", children: ["Aturan Sinkronisasi (", syncRules.length, ")"] }), _jsxs("button", { onClick: handleManageSyncRules, className: "btn btn-outline btn-sm", children: [_jsx(EyeIcon, { className: "h-4 w-4 mr-2" }), "Lihat Semua"] })] }), _jsxs("div", { className: "space-y-3", children: [syncRules.slice(0, 3).map((rule) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "text-sm font-medium text-gray-900", children: rule.name }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: [rule.syncStrategy, " \u2022 ", rule.syncScope] })] }), _jsx("div", { className: "flex items-center space-x-2", children: _jsx("span", { className: cn('inline-flex items-center px-2 py-1 rounded-full text-xs font-medium', rule.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'), children: rule.isActive ? 'Aktif' : 'Nonaktif' }) })] }, rule.id))), syncRules.length > 3 && (_jsx("div", { className: "text-center pt-2", children: _jsxs("button", { onClick: handleManageSyncRules, className: "text-sm text-primary-600 hover:text-primary-500", children: ["+", syncRules.length - 3, " aturan lainnya"] }) }))] })] })), showConnectModal && (_jsx(ConnectMarketplaceModal, { marketplace: selectedMarketplace, onClose: () => {
                    setShowConnectModal(false);
                    setSelectedMarketplace(null);
                }, onSuccess: () => {
                    queryClient.invalidateQueries(['marketplace-accounts']);
                    setShowConnectModal(false);
                    setSelectedMarketplace(null);
                } })), showSyncRulesModal && (_jsx(SyncRulesModal, { onClose: () => setShowSyncRulesModal(false), onRuleChange: () => {
                    queryClient.invalidateQueries(['sync-rules']);
                } }))] }));
};
export default MarketplacesPage;
//# sourceMappingURL=MarketplacesPage.js.map