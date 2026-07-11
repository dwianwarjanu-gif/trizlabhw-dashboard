import { useEffect, useState, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PlusIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  LinkIcon,
  EyeIcon,
  ClockIcon,
  PlayCircleIcon,
  PauseCircleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import Can from "@/components/auth/Can";

import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { marketplacesApi, queueApi, stockSyncApi, syncApi } from "@/services/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import MarketplaceCard from "@/components/marketplaces/MarketplaceCard";
import ConnectMarketplaceModal from "@/components/marketplaces/ConnectMarketplaceModal";
import MarketplaceProductsModal from "@/components/marketplaces/MarketplaceProductsModal";
import SyncRulesModal from "@/components/marketplaces/SyncRulesModal";
import SyncStatsCard from "@/components/marketplaces/SyncStatsCard";
import { cn } from "@/utils/cn";



const PERMISSIONS = {
  MARKETPLACE_VIEW: "marketplaces.view",
  MARKETPLACE_ACCOUNT_CREATE: "marketplaces.connect",
  MARKETPLACE_ACCOUNT_TEST_CONNECTION: "marketplaces.test_connection",
  MARKETPLACE_PRODUCT_SYNC: "marketplaces.sync",
  SYNC_RULE_READ: "marketplaces.rules.view",
  SYNC_RULE_MANAGE: "marketplaces.rules.manage",
} as const;

type PermissionValue = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

type CanProps = {
  permission: PermissionValue | string;
  children: ReactNode;
  fallback?: ReactNode;
};

function unwrap<T = any>(value: any): T {
  return (value?.data ?? value) as T;
}

function pickArray<T = any>(value: any, keys: string[]): T[] {
  if (!value || typeof value !== "object") return [];

  for (const key of keys) {
    const candidate = value[key];
    if (Array.isArray(candidate)) return candidate as T[];
  }

  return Array.isArray(value) ? (value as T[]) : [];
}

function getNumber(value: any, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getLogStatus(log: any): "SUCCESS" | "FAILED" {
  const status = String(log?.status || "").toUpperCase();
  if (status === "FAILED") return "FAILED";
  if (Number(log?.failureCount || 0) > 0) return "FAILED";
  return "SUCCESS";
}

function getLogMarketplaceName(log: any): string {
  return (
    log?.marketplaceAccount?.marketplace?.name ||
    log?.syncResults?.[0]?.marketplaceName ||
    "Marketplace"
  );
}

function formatDateTime(value: any): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const Can = ({ permission, children, fallback = null }: CanProps) => {
  const { hasPermission } = useAuth();
  return hasPermission(String(permission)) ? <>{children}</> : <>{fallback}</>;
};

const MarketplacesPage: React.FC = () => {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showSyncRulesModal, setShowSyncRulesModal] = useState(false);
  const [selectedMarketplace, setSelectedMarketplace] = useState<any>(null);
  const [selectedDetailAccount, setSelectedDetailAccount] = useState<any>(null);
  const [liveSync, setLiveSync] = useState<any>(null);
  const [autoSyncAccountId, setAutoSyncAccountId] = useState("");
  const [autoSyncInterval, setAutoSyncInterval] = useState<"off" | "5" | "15" | "60">("5");
  const [liveLogs, setLiveLogs] = useState<any[]>([]);
  const [cronAnalyticsTimeRange, setCronAnalyticsTimeRange] = useState<"24h" | "7d" | "30d">("24h");

  const queryClient = useQueryClient();
  const { socket, isConnected: socketConnected } = useSocket();
  const { hasPermission, permissions, user } = useAuth();

  const storedUser = (() => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
})();

const storedPermissions = (() => {
  try {
    return JSON.parse(localStorage.getItem("permissions") || "[]");
  } catch {
    return [];
  }
})();

const role = user?.role || storedUser?.role;
const roleKey = String(role || "").trim().toUpperCase();
const isAdmin = roleKey === "ADMIN";

const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  ADMIN: ["*"],
  MANAGER: [
    "marketplaces.view",
    "marketplaces.connect",
    "marketplaces.update",
    "marketplaces.disconnect",
    "marketplaces.test_connection",
    "marketplaces.sync",
    "marketplaces.rules.view",
    "marketplaces.rules.manage",
  ],
  STAFF: [
    "marketplaces.view",
    "marketplaces.test_connection",
    "marketplaces.sync",
  ],
  VIEWER: ["marketplaces.view"],
};

const effectivePermissions = Array.from(
  new Set([
    ...(permissions || []),
    ...(storedPermissions || []),
    ...(ROLE_PERMISSION_MAP[roleKey] || []),
  ])
);

const can = (permission: string) => {
  if (!permission) return true;
  if (isAdmin || effectivePermissions.includes("*")) return true;
  return effectivePermissions.includes(permission) || hasPermission(permission);
};

  const canViewMarketplaces = can(PERMISSIONS.MARKETPLACE_VIEW);
  const canConnectMarketplace = can(PERMISSIONS.MARKETPLACE_ACCOUNT_CREATE);
  const canTestConnection = can(PERMISSIONS.MARKETPLACE_ACCOUNT_TEST_CONNECTION);
  const canSyncProducts = can(PERMISSIONS.MARKETPLACE_PRODUCT_SYNC);
  const canReadSyncRules = can(PERMISSIONS.SYNC_RULE_READ);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["marketplace-accounts"] });
    queryClient.invalidateQueries({ queryKey: ["available-marketplaces"] });
    queryClient.invalidateQueries({ queryKey: ["sync-rules"] });
    queryClient.invalidateQueries({ queryKey: ["sync-stats"] });
    queryClient.invalidateQueries({ queryKey: ["sync-logs"] });
    queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
  }, [queryClient]);

  useEffect(() => {
    if (!socket) return;

    const handleSyncProgress = (payload: any) => {
      setLiveSync(payload);
      queryClient.invalidateQueries({ queryKey: ["sync-logs"] });
      queryClient.invalidateQueries({ queryKey: ["sync-stats"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["cron-analytics"] });
    };

    const handleQueueStatsUpdated = (payload: any) => {
      queryClient.setQueryData(["queue-stats"], payload?.stats || payload);
      queryClient.invalidateQueries({ queryKey: ["sync-logs"] });
      queryClient.invalidateQueries({ queryKey: ["sync-stats"] });
    };

    const handleLiveLog = (payload: any) => {
      setLiveLogs((prev) => {
        const nextLogs = [payload, ...prev].slice(0, 50);
        localStorage.setItem("marketplace-live-sync-logs", JSON.stringify(nextLogs));
        return nextLogs;
      });
    };

    socket.on("sync-progress", handleSyncProgress);
    socket.on("queue-stats-updated", handleQueueStatsUpdated);
    socket.on("sync-log-live", handleLiveLog);

    return () => {
      socket.off("sync-progress", handleSyncProgress);
      socket.off("queue-stats-updated", handleQueueStatsUpdated);
      socket.off("sync-log-live", handleLiveLog);
    };
  }, [socket, queryClient]);

  useEffect(() => {
    const savedLogs = localStorage.getItem("marketplace-live-sync-logs");

    if (savedLogs) {
      try {
        const parsedLogs = JSON.parse(savedLogs);
        if (Array.isArray(parsedLogs)) {
          setLiveLogs(parsedLogs.slice(0, 50));
        }
      } catch {
        localStorage.removeItem("marketplace-live-sync-logs");
      }
    }
  }, []);

  const { data: accountsData, isLoading: accountsLoading } = useQuery({
    queryKey: ["marketplace-accounts"],
    queryFn: marketplacesApi.getUserAccounts,
    refetchOnMount: "always",
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: 0,
  });

  const { data: tenantAccountsData } = useQuery({
    queryKey: ["tenant-marketplace-accounts"],
    queryFn: marketplacesApi.getTenantAccounts,
    refetchOnMount: "always",
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: 0,
  });

  const { data: marketplacesData, isLoading: marketplacesLoading } = useQuery({
    queryKey: ["available-marketplaces"],
    queryFn: marketplacesApi.getAll,
    refetchOnMount: "always",
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: 0,
  });

  const { data: syncRulesData } = useQuery({
    queryKey: ["sync-rules"],
    queryFn: () => stockSyncApi.getRules({ page: 1, limit: 100 }),
    refetchOnMount: "always",
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: 0,
  });

  const { data: detailLogsData, isLoading: detailLogsLoading } = useQuery({
    queryKey: ["marketplace-sync-history", selectedDetailAccount?.id],
    queryFn: () =>
      stockSyncApi.getLogs({
        page: 1,
        limit: 20,
        marketplaceAccountId: selectedDetailAccount.id,
      } as any),
    enabled: Boolean(selectedDetailAccount?.id),
    refetchOnWindowFocus: false,
    retry: 0,
  });

  const { data: syncLogsData, isLoading: syncLogsLoading } = useQuery({
    queryKey: ["sync-logs"],
    queryFn: () => stockSyncApi.getLogs({ page: 1, limit: 10 }),
    refetchOnMount: "always",
    staleTime: 0,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    retry: 0,
  });

  const { data: syncStatsResponse } = useQuery({
    queryKey: ["sync-stats", "24h"],
    queryFn: () => stockSyncApi.getStats("24h"),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchInterval: false,
    retry: 0,
  });

  const { data: queueStatsData } = useQuery({
    queryKey: ["queue-stats"],
    queryFn: async () => {
       const response = await queueApi.getStats();
       return response.data.stats;
    },
    refetchOnWindowFocus: false,
    retry: 0,
  });

  const { data: cronAnalyticsData, isLoading: cronAnalyticsLoading } = useQuery({
    queryKey: ["cron-analytics", cronAnalyticsTimeRange],
    queryFn: async () => {
      const response = await queueApi.getCronAnalytics(cronAnalyticsTimeRange);
      return response.data.analytics;
    },
    refetchOnWindowFocus: false,
    retry: 0,
  });

  const { data: autoSyncJobsData } = useQuery({
    queryKey: ["auto-sync-jobs"],
    queryFn: async () => {
       const response = await queueApi.getAutoSyncJobs();
       return response.data.jobs || [];
    },
    refetchOnWindowFocus: false,
    retry: 0,
  });

  const getAutoSyncIntervalForAccount = (accountId: string): "off" | "5" | "15" | "60" => {
    const job = autoSyncJobs.find(
      (item: any) => item.marketplaceAccountId === accountId
  );

    if (!job) return "off";

    const minutes =
      Number(job.intervalMinutes) ||
      Math.round(Number(job.every || 0) / 60000);

    if (minutes === 5) return "5";
    if (minutes === 15) return "15";
    if (minutes === 60) return "60";

    return "off";
  };

  const retrySyncMutation = useMutation({
    mutationFn: (logId: string) => (stockSyncApi as any).retrySyncLog(logId),
    onSuccess: () => {
      toast.success("Retry sync berhasil");
      queryClient.invalidateQueries({ queryKey: ["sync-logs"] });
      queryClient.invalidateQueries({ queryKey: ["sync-stats"] });
      queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-accounts"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Retry sync gagal");
    },
  });

  const retryAllFailedMutation = useMutation({
    mutationFn: queueApi.retryAllFailed,
    onSuccess: (response) => {
      const data = response?.data || {};
      toast.success(data.message || "Retry failed jobs berhasil");

      queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
      queryClient.invalidateQueries({ queryKey: ["sync-logs"] });
      queryClient.invalidateQueries({ queryKey: ["sync-stats"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Retry failed jobs gagal");
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: marketplacesApi.testConnection,
    onSuccess: (response) => {
      const result = unwrap(response);

      if (result?.success) {
        toast.success("Koneksi berhasil!");
      } else {
        toast.error(`Koneksi gagal: ${result?.message || "Unknown error"}`);
      }

      queryClient.invalidateQueries({ queryKey: ["marketplace-accounts"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Gagal menguji koneksi");
    },
  });

  const syncProductsMutation = useMutation({
    mutationFn: ({ marketplaceAccountIds }: { marketplaceAccountIds: string[] }) =>
      syncApi.syncProducts({ marketplaceAccountIds } as any),
    onSuccess: () => {
      toast.success("Sinkronisasi produk dimulai");

      setLiveSync({
        type: "sync-products",
        status: "completed",
        progress: 100,
        message: "Sinkronisasi produk selesai",
      });

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["sync-stats"] });
        queryClient.invalidateQueries({ queryKey: ["sync-logs"] });
        queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
        queryClient.invalidateQueries({ queryKey: ["marketplace-accounts"] });
      }, 1500);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Sinkronisasi produk gagal"
       )  
      },
    });

  const enableAutoSyncMutation = useMutation({
    mutationFn: (data: { marketplaceAccountId: string; intervalMinutes: 5 | 15 | 60 }) =>
      queueApi.enableAutoSync(data),
    onSuccess: (response) => {
      toast.success(response?.data?.message || "Auto sync berhasil diaktifkan");
      queryClient.invalidateQueries({ queryKey: ["auto-sync-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
      queryClient.invalidateQueries({ queryKey: ["cron-analytics"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Gagal mengaktifkan auto sync");
    },
  });

  const disableAutoSyncMutation = useMutation({
    mutationFn: (marketplaceAccountId: string) =>
      queueApi.disableAutoSync(marketplaceAccountId),
    onSuccess: (response) => {
      toast.success(response?.data?.message || "Auto sync dimatikan");
      queryClient.invalidateQueries({ queryKey: ["auto-sync-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
      queryClient.invalidateQueries({ queryKey: ["cron-analytics"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Gagal mematikan auto sync");
    },
  });

  const accountsResponse = unwrap<any>(accountsData);
  const tenantAccountsResponse = unwrap<any>(tenantAccountsData);

  const tenantAccounts = pickArray<any>(tenantAccountsResponse, [
    "rows",
    "accounts",
    "items",
    "data",
  ]);

  const connectTenantAccountMutation = useMutation({
    mutationFn: (id: string) =>
      marketplacesApi.connectTenantAccount(id, {
        accessToken: "demo-access-token",
        refreshToken: "demo-refresh-token",
        shopId: "demo-shopee-shop",
        expiresAt: "2026-12-31 23:59:59",
      }),
    onSuccess: () => {
      toast.success("Marketplace account connected");
      queryClient.invalidateQueries({ queryKey: ["tenant-marketplace-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-accounts"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Connect account gagal");
    },
  });

const disconnectTenantAccountMutation = useMutation({
  mutationFn: marketplacesApi.disconnectTenantAccount,
    onSuccess: () => {
      toast.success("Marketplace account disconnected");
      queryClient.invalidateQueries({ queryKey: ["tenant-marketplace-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-accounts"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Disconnect account gagal");
    },
  });

  const marketplacesResponse = unwrap<any>(marketplacesData);
  const syncRulesResponse = unwrap<any>(syncRulesData);
  const syncLogsResponse = unwrap<any>(syncLogsData);
  const detailLogsResponse = unwrap<any>(detailLogsData);

  const syncLogs = pickArray<any>(syncLogsResponse, ["logs", "items", "data"]);
  const detailLogs = pickArray<any>(detailLogsResponse, ["logs", "items", "data"]);

  const accounts = pickArray<any>(accountsResponse, [
    "accounts",
    "marketplaceAccounts",
    "items",
    "data",
  ]);

  const availableMarketplaces = pickArray<any>(marketplacesResponse, [
    "marketplaces",
    "items",
    "data",
  ]);

  const syncRules = pickArray<any>(syncRulesResponse, ["rules", "items", "data"]);

  const syncStats =
    (syncStatsResponse as any)?.data?.stats ??
    (syncStatsResponse as any)?.stats ??
    {};


  const queueStats = queueStatsData || {
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
    delayed: 0,
    paused: false,
  };

  const cronAnalytics = cronAnalyticsData || {
    timeRange: cronAnalyticsTimeRange,
    activeSchedules: 0,
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
    successRate: 0,
    marketplaces: [],
  };

  const cronMarketplaces = Array.isArray(cronAnalytics.marketplaces)
    ? cronAnalytics.marketplaces
    : [];

  const autoSyncJobs = Array.isArray(autoSyncJobsData) ? autoSyncJobsData : [];

  const connectedAccounts = accounts.filter(
    (account: any) => account?.isConnected === true || account?.isConnected === 1
  );

 const isShopeeAccount = (account: any) => {
   const code = String(account?.marketplace?.code || "").toLowerCase();
   const name = String(account?.marketplace?.name || "").toLowerCase();

  return code.includes("shopee") || name.includes("shopee");
 };

  const isOAuthReady = (account: any) => {
   return Boolean(
    account?.isConnected &&
      account?.shopId &&
      account?.accessToken &&
      account?.refreshToken
  );
};

const canUseAutoSync = (account: any) => {
  if (!account) return false;
  if (!isShopeeAccount(account)) return true;

  return isOAuthReady(account);
};

const selectedAutoSyncAccount = connectedAccounts.find(
  (account: any) => account.id === autoSyncAccountId
);

const selectedAutoSyncBlocked =
  Boolean(selectedAutoSyncAccount) && !canUseAutoSync(selectedAutoSyncAccount);

  const handleConnectMarketplace = (marketplace: any) => {
    setSelectedMarketplace(marketplace);
    setShowConnectModal(true);
  };

  const handleTestConnection = (accountId: string) => {
    testConnectionMutation.mutate(accountId);
  };

  const handleSyncProducts = (accountId: string) => {
    setLiveSync({
      type: "sync-products",
      status: "queued",
      progress: 0,
      marketplaceAccountId: accountId,
      createdAt: new Date().toISOString(),
    });

    syncProductsMutation.mutate({
      marketplaceAccountIds: [accountId],
    });
  };

  const handleShopeeOAuthConnect = async () => {
    try {
      const response = await marketplacesApi.getShopeeOAuthUrl();
      const redirectUrl = response.data?.redirectUrl;

      if (!redirectUrl) {
        throw new Error(response.data?.message || "OAuth URL not found");
      }

      window.location.href = redirectUrl;
    } catch (error: any) {
      console.error("Shopee OAuth connect failed:", error);

      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Shopee OAuth error"
      );
    }
  };

  const handleManageSyncRules = () => {
    setShowSyncRulesModal(true);
  };

  const handleApplyAutoSync = () => {
  if (!autoSyncAccountId) {
    toast.error("Pilih marketplace dulu");
    return;
  }

  const account = connectedAccounts.find(
    (item: any) => item.id === autoSyncAccountId
  );

  if (!account) {
    toast.error("Marketplace account tidak ditemukan");
    return;
  }

  if (autoSyncInterval !== "off" && !canUseAutoSync(account)) {
    toast.error(
      "OAuth Shopee belum lengkap. Hubungkan ulang akun Shopee sebelum mengaktifkan Auto Sync."
    );
    return;
  }

  if (autoSyncInterval === "off") {
    disableAutoSyncMutation.mutate(autoSyncAccountId);
    return;
  }

  enableAutoSyncMutation.mutate({
    marketplaceAccountId: autoSyncAccountId,
    intervalMinutes: Number(autoSyncInterval) as 5 | 15 | 60,
  });
};

  const handleAccountAutoSyncChange = (
  accountId: string,
  value: "off" | "5" | "15" | "60"
) => {
  const account = connectedAccounts.find((item: any) => item.id === accountId);

  if (!account) {
    toast.error("Marketplace account tidak ditemukan");
    return;
  }

  if (value !== "off" && !canUseAutoSync(account)) {
    toast.error(
      "OAuth Shopee belum lengkap. Hubungkan ulang akun Shopee sebelum mengaktifkan Auto Sync."
    );
    return;
  }

  if (value === "off") {
    disableAutoSyncMutation.mutate(accountId);
    return;
  }

  enableAutoSyncMutation.mutate({
    marketplaceAccountId: accountId,
    intervalMinutes: Number(value) as 5 | 15 | 60,
  });
};

  if (!canViewMarketplaces) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed bg-white">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">
            Anda tidak punya akses ke halaman Marketplace.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Minta permission <code>marketplaces.view</code> ke admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
          <p className="mt-1 text-sm text-gray-600">
            Kelola koneksi marketplace dan aturan sinkronisasi
          </p>
        </div>

        <div className="mt-4 flex space-x-3 sm:mt-0">
          <Can permission={PERMISSIONS.SYNC_RULE_MANAGE}>
            <button
              onClick={handleManageSyncRules}
              className="btn btn-outline btn-md"
            >
              <Cog6ToothIcon className="mr-2 h-5 w-5" />
              Aturan Sync
            </button>
          </Can>

          <Can permission={PERMISSIONS.MARKETPLACE_ACCOUNT_CREATE}>
            <button
              onClick={() => {
                setSelectedMarketplace(null);
                setShowConnectModal(true);
              }}
              className="btn btn-primary btn-md"
            >
              <PlusIcon className="mr-2 h-5 w-5" />
              Hubungkan Marketplace
            </button>
          </Can>
        </div>
      </div>

      {liveSync && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              Realtime Sync: <strong>{liveSync.type}</strong> •{" "}
              <strong>{liveSync.status}</strong> • {liveSync.progress || 0}%
              {socketConnected ? " • WebSocket aktif" : " • WebSocket reconnecting"}
            </div>

            <div className="h-2 w-full rounded-full bg-blue-100 sm:w-48">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all"
                style={{ width: `${Math.min(Number(liveSync.progress || 0), 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <SyncStatsCard
          title="Total Sync"
          value={getNumber(syncStats.totalSyncs ?? syncStats.total_syncs)}
          icon={ArrowPathIcon}
          color="blue"
        />

        <SyncStatsCard
          title="Berhasil"
          value={getNumber(syncStats.successfulSyncs ?? syncStats.successful_syncs)}
          icon={CheckCircleIcon}
          color="green"
        />

        <SyncStatsCard
          title="Gagal"
          value={getNumber(syncStats.failedSyncs ?? syncStats.failed_syncs)}
          icon={XCircleIcon}
          color="red"
        />

        <SyncStatsCard
          title="Success Rate"
          value={`${getNumber(syncStats.successRate ?? syncStats.success_rate)}%`}
          icon={ClockIcon}
          color="purple"
        />
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            Queue Monitor
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Status background worker BullMQ.
          </p>
      </div>

      <div className="flex items-center gap-2">
        {getNumber(queueStats.failed) > 0 && (
          <button
            type="button"
            onClick={() => retryAllFailedMutation.mutate()}
            disabled={retryAllFailedMutation.isPending}
            className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {retryAllFailedMutation.isPending ? "Retrying..." : "Retry All Failed"}
          </button>
        )}

      <span
        className={cn(
          "rounded-full px-3 py-1 text-xs font-medium",
          queueStats.paused
            ? "bg-yellow-100 text-yellow-800"
            : "bg-green-100 text-green-800"
        )}
      >
        {queueStats.paused ? "Paused" : "Running"}
       </span>
     </div>
    </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Waiting</p>
              <ClockIcon className="h-5 w-5 text-gray-400" />
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900">
              {getNumber(queueStats.waiting)}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Active</p>
              <PlayCircleIcon className="h-5 w-5 text-blue-500" />
            </div>
            <p className="mt-3 text-2xl font-bold text-blue-600">
              {getNumber(queueStats.active)}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Completed</p>
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            </div>
            <p className="mt-3 text-2xl font-bold text-green-600">
              {getNumber(queueStats.completed)}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Failed</p>
              <XCircleIcon className="h-5 w-5 text-red-500" />
            </div>
            <p className="mt-3 text-2xl font-bold text-red-600">
              {getNumber(queueStats.failed)}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Delayed</p>
              <PauseCircleIcon className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="mt-3 text-2xl font-bold text-yellow-600">
              {getNumber(queueStats.delayed)}
            </p>
          </div>
        </div>

 <div className="overflow-hidden rounded-lg bg-gray-950 shadow-soft">
  <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
    <div>
      <h2 className="text-lg font-medium text-white">Live Sync Logs</h2>
      <p className="mt-1 text-sm text-gray-400">
        Realtime event dari BullMQ worker dan queue.
      </p>
    </div>

    <button
      type="button"
      onClick={() => {
        setLiveLogs([]);
        localStorage.removeItem("marketplace-live-sync-logs");
      }}
      className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-800"
    >
      Clear
    </button>
  </div>

  <div className="max-h-80 overflow-y-auto px-5 py-4 font-mono text-xs">
    {liveLogs.length === 0 ? (
      <p className="text-gray-500">
        Belum ada live log. Jalankan sync produk untuk melihat event realtime.
      </p>
    ) : (
      <div className="space-y-2">
        {liveLogs.map((log, index) => {
          const time = log.createdAt
            ? new Date(log.createdAt).toLocaleTimeString("id-ID")
            : new Date().toLocaleTimeString("id-ID");

          const color =
            log.level === "error"
              ? "text-red-400"
              : log.level === "success"
                ? "text-green-400"
                : "text-blue-300";

          return (
            <div key={`${log.jobId || "log"}-${index}`} className="flex gap-3">
              <span className="shrink-0 text-gray-500">[{time}]</span>
              <span className={cn("shrink-0 uppercase", color)}>
                {log.status || "info"}
              </span>
              <span className="text-gray-300">
                {log.message || "Sync event"}
              </span>
              {log.progress !== null && log.progress !== undefined && (
                <span className="text-gray-500">({log.progress}%)</span>
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
</div>

<div className="rounded-lg bg-white p-6 shadow-soft">
  <div className="mb-6 flex items-center justify-between">
    <div>
      <h2 className="text-lg font-medium text-gray-900">
        Auto Sync Scheduler
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Atur sinkronisasi produk otomatis per marketplace.
      </p>
    </div>
  </div>
  
<div className="rounded-lg bg-white p-6 shadow-soft">
  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 className="text-lg font-medium text-gray-900">
        Cron Dashboard Analytics
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Ringkasan performa auto sync scheduler.
      </p>
    </div>

    <select
      value={cronAnalyticsTimeRange}
      onChange={(event) =>
        setCronAnalyticsTimeRange(event.target.value as "24h" | "7d" | "30d")
      }
      className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
      <option value="24h">Last 24 hours</option>
      <option value="7d">Last 7 days</option>
      <option value="30d">Last 30 days</option>
    </select>
  </div>

  {cronAnalyticsLoading ? (
    <div className="flex h-32 items-center justify-center">
      <LoadingSpinner size="md" text="Memuat cron analytics..." />
    </div>
  ) : (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Active Schedules</p>
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {getNumber(cronAnalytics.activeSchedules)}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Runs</p>
          <p className="mt-3 text-2xl font-bold text-blue-600">
            {getNumber(cronAnalytics.totalRuns)}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Success Rate</p>
          <p className="mt-3 text-2xl font-bold text-green-600">
            {getNumber(cronAnalytics.successRate)}%
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Failed Runs</p>
          <p className="mt-3 text-2xl font-bold text-red-600">
            {getNumber(cronAnalytics.failedRuns)}
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200">
        <div className="border-b border-gray-200 px-4 py-3">
          <p className="text-sm font-medium text-gray-900">
            Marketplace Cron Performance
          </p>
        </div>

        {cronMarketplaces.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">
            Belum ada cron execution pada periode ini.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {cronMarketplaces.map((item: any) => (
              <div
                key={item.marketplaceAccountId}
                className="grid grid-cols-1 gap-3 px-4 py-4 md:grid-cols-5 md:items-center"
              >
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-900">
                    {item.marketplaceName}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {item.storeName}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Runs</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {getNumber(item.totalRuns)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Success Rate</p>
                  <p className="text-sm font-semibold text-green-700">
                    {getNumber(item.successRate)}%
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Last Run</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDateTime(item.lastRun)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )}
</div>

  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Marketplace Account
      </label>
      <select
        value={autoSyncAccountId}
        onChange={(event) => setAutoSyncAccountId(event.target.value)}
        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">Pilih marketplace</option>
        {connectedAccounts.map((account: any) => (
          <option key={account.id} value={account.id}>
            {account?.marketplace?.name || "Marketplace"} -{" "}
            {account?.storeName || account?.shopName || "Store"}
          </option>
        ))}
      </select>
      {selectedAutoSyncBlocked && (
        <div className="mt-2 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-700">
          OAuth Shopee belum lengkap. Silakan reconnect akun Shopee terlebih dahulu.
        </div>
       )}
    </div>

    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Interval
      </label>
      <select
        value={autoSyncInterval}
        onChange={(event) =>
          setAutoSyncInterval(event.target.value as "off" | "5" | "15" | "60")
        }
        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="off">Off</option>
        <option value="5">Every 5 minutes</option>
        <option value="15">Every 15 minutes</option>
        <option value="60">Every 1 hour</option>
      </select>
    </div>

    <div className="flex items-end">
      <button
        type="button"
        onClick={handleApplyAutoSync}
        disabled={
          enableAutoSyncMutation.isPending ||
          disableAutoSyncMutation.isPending ||
          selectedAutoSyncBlocked
        }
        className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enableAutoSyncMutation.isPending || disableAutoSyncMutation.isPending
          ? "Saving..."
          : "Apply Scheduler"}
      </button>
    </div>
  </div>

  <div className="mt-6 rounded-xl border border-gray-200">
    <div className="border-b border-gray-200 px-4 py-3">
      <p className="text-sm font-medium text-gray-900">
        Active Auto Sync Jobs
      </p>
    </div>

    {autoSyncJobs.length === 0 ? (
      <div className="px-4 py-6 text-sm text-gray-500">
        Belum ada auto sync aktif.
      </div>
    ) : (
      <div className="divide-y divide-gray-100">
        {autoSyncJobs.map((job: any) => (
          <div
            key={job.key}
            className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">
                {job.name || "sync-products"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Every {Math.round(Number(job.every || 0) / 60000)} minutes
              </p>
            </div>

            <p className="text-xs text-gray-500">
              Next:{" "}
              {job.next
                ? new Date(Number(job.next)).toLocaleString("id-ID")
                : "-"}
            </p>
          </div>
        ))}
      </div>
    )}
  </div>
</div>
      
 <div className="rounded-lg bg-white p-6 shadow-soft">
  <div className="mb-6 flex items-center justify-between">
    <div>
      <h2 className="text-lg font-medium text-gray-900">
        Tenant Marketplace Accounts
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Status koneksi token marketplace dari tenant database.
      </p>
    </div>
  </div>

  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
    {tenantAccounts.map((account: any) => {
      const connected =
        account.is_connected === 1 ||
        account.is_connected === true;

      return (
        <div
          key={account.id}
          className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {account.marketplace_name || account.marketplace_code}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {account.store_name}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Shop ID: {account.shop_id || "-"}
              </p>
            </div>

            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                connected
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              )}
            >
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Expires: {formatDateTime(account.token_expires_at)}
          </p>

          <div className="mt-4 flex gap-2">
            {connected ? (
              <button
                type="button"
                onClick={() =>
                  disconnectTenantAccountMutation.mutate(account.id)
                }
                disabled={disconnectTenantAccountMutation.isPending}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
              >
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  connectTenantAccountMutation.mutate(account.id)
                }
                disabled={connectTenantAccountMutation.isPending}
                className="rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-60"
              >
                Connect Demo
              </button>
            )}
          </div>
        </div>
      );
    })}
  </div>
</div>

      <div className="rounded-lg bg-white p-6 shadow-soft">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            Marketplace Terhubung ({connectedAccounts.length})
          </h2>

          <button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["marketplace-accounts"] });
              queryClient.invalidateQueries({ queryKey: ["sync-stats"] });
              queryClient.invalidateQueries({ queryKey: ["sync-logs"] });
            }}
            className="btn btn-outline btn-sm"
          >
            <ArrowPathIcon className="mr-2 h-4 w-4" />
            Refresh
          </button>
        </div>

        {accountsLoading ? (
          <div className="flex h-32 items-center justify-center">
            <LoadingSpinner size="md" text="Memuat marketplace..." />
          </div>
        ) : connectedAccounts.length === 0 ? (
          <div className="py-8 text-center">
            <LinkIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Belum ada marketplace terhubung
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Hubungkan marketplace pertama Anda untuk mulai berjualan
            </p>

            {canConnectMarketplace && (
              <button
                onClick={() => {
                  setSelectedMarketplace(null);
                  setShowConnectModal(true);
                }}
                className="btn btn-primary btn-md mt-4"
              >
                <PlusIcon className="mr-2 h-5 w-5" />
                Hubungkan Marketplace
              </button>
            )}
          </div>
        ) : (
 <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
  {connectedAccounts.map((account: any) => (
  <div key={account.id} className="space-y-3">
    <MarketplaceCard
      account={account}
      onTestConnection={
        canTestConnection
          ? () => handleTestConnection(account.id)
          : undefined
      }
      onSyncProducts={
        canSyncProducts
          ? () => handleSyncProducts(account.id)
          : undefined
      }
      onViewDetails={() => setSelectedDetailAccount(account)}
      isTestingConnection={testConnectionMutation.isPending}
      isSyncingProducts={syncProductsMutation.isPending}
    />

    {String(account?.marketplace?.code || "").toUpperCase() === "SHOPEE" &&
       account?.oauthStatus === "INCOMPLETE" && (
         <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
           <div className="font-medium">OAuth belum lengkap</div>
           <div className="mt-1 text-xs">
             Hubungkan ulang Shopee untuk mengambil access token dan refresh token real.
           </div>
         </div>
       )}

    {String(account?.marketplace?.code || "").toLowerCase() === "shopee" && (
      <button
        type="button"
        onClick={handleShopeeOAuthConnect}
        className="w-full rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100"
      >
        Reconnect Shopee OAuth
      </button>
     )}

    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <label className="mb-2 block text-xs font-medium text-gray-600">
        Auto Sync
      </label>

      <select
        value={getAutoSyncIntervalForAccount(account.id)}
        onChange={(event) =>
          handleAccountAutoSyncChange(
            account.id,
            event.target.value as "off" | "5" | "15" | "60"
          )
        }
        disabled={
          enableAutoSyncMutation.isPending ||
          disableAutoSyncMutation.isPending ||
          !canUseAutoSync(account)
        }
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="off">Off</option>
        <option value="5">Every 5 minutes</option>
        <option value="15">Every 15 minutes</option>
        <option value="60">Every 1 hour</option>
      </select>
      {!canUseAutoSync(account) && (
        <div className="mt-2 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-xs text-yellow-700">
         OAuth Shopee belum lengkap. Silakan reconnect akun Shopee terlebih dahulu.
        </div>
      )}
    </div>
   </div>
  ))}
 </div>
 )}
</div>  

      <div className="rounded-lg bg-white p-6 shadow-soft">
        <h2 className="mb-6 text-lg font-medium text-gray-900">
          Marketplace Tersedia
        </h2>

        {marketplacesLoading ? (
          <div className="flex h-32 items-center justify-center">
            <LoadingSpinner size="md" text="Memuat marketplace..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {availableMarketplaces.map((marketplace: any) => {
              const isConnected = connectedAccounts.some(
                (account: any) => account?.marketplace?.code === marketplace?.code
              );

              return (
                <div
                  key={marketplace.id}
                  className={cn(
                    "relative rounded-lg border-2 border-dashed p-6 transition-colors hover:border-gray-400",
                    isConnected ? "border-green-300 bg-green-50" : "border-gray-300"
                  )}
                >
                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                      {marketplace.logo ? (
                        <img
                          src={marketplace.logo}
                          alt={marketplace.name}
                          className="h-8 w-8 object-contain"
                        />
                      ) : (
                        <span className="text-lg font-bold text-gray-600">
                          {String(marketplace.name || "?").charAt(0)}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {marketplace.name}
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      {marketplace.description}
                    </p>

                    {isConnected ? (
                      <div className="mt-3">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          <CheckCircleIcon className="mr-1 h-3 w-3" />
                          Terhubung
                        </span>
                      </div>
                    ) : (
                      canConnectMarketplace && (
                        <div className="mt-3">
                          {marketplace.code === "shopee" ? (
                            <button
                              type="button"
                              onClick={handleShopeeOAuthConnect}
                              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
                            >
                              Hubungkan Shopee
                            </button>
                          ) : (
                            <button
                               type="button"
                               onClick={() => handleConnectMarketplace(marketplace)}
                               className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                               Hubungkan
                            </button>
                           )}
                        </div>
                       )
                     )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {canReadSyncRules && syncRules.length > 0 && (
        <div className="rounded-lg bg-white p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              Aturan Sinkronisasi ({syncRules.length})
            </h2>

            <Can permission={PERMISSIONS.SYNC_RULE_MANAGE}>
              <button
                onClick={handleManageSyncRules}
                className="btn btn-outline btn-sm"
              >
                <EyeIcon className="mr-2 h-4 w-4" />
                Lihat Semua
              </button>
            </Can>
          </div>

          <div className="space-y-3">
            {syncRules.slice(0, 3).map((rule: any) => (
              <div
                key={rule.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
              >
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {rule.name}
                  </h4>
                  <p className="mt-1 text-xs text-gray-500">
                    {rule.syncStrategy} • {rule.syncScope}
                  </p>
                </div>

                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                    rule.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  )}
                >
                  {rule.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg bg-white shadow-soft">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">
            Riwayat Sinkronisasi
          </h2>
        </div>

        {syncLogsLoading ? (
          <div className="flex h-32 items-center justify-center">
            <LoadingSpinner size="md" text="Memuat riwayat sinkronisasi..." />
          </div>
        ) : syncLogs.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            Belum ada riwayat sinkronisasi.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {syncLogs.map((log: any) => {
              const status = getLogStatus(log);
              const isFailed = status === "FAILED";

              return (
                <div
                  key={log.id}
                  className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "mt-1 flex h-5 w-5 items-center justify-center rounded-full",
                        isFailed ? "text-red-600" : "text-green-600"
                      )}
                    >
                      {isFailed ? (
                        <XCircleIcon className="h-5 w-5" />
                      ) : (
                        <CheckCircleIcon className="h-5 w-5" />
                      )}
                    </div>

                    <div>
                      <p className="font-medium text-gray-900">
                        {getLogMarketplaceName(log)}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Success: {getNumber(log.successCount)} • Failed:{" "}
                        {getNumber(log.failureCount)}
                      </p>

                      {isFailed && log.errorMessage && (
                        <p className="mt-1 text-xs text-red-600">
                          {log.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:justify-end">
                    <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                      <ClockIcon className="h-4 w-4" />
                      {formatDateTime(log.syncedAt || log.createdAt)}
                    </span>

                    {isFailed && (
                      <button
                        type="button"
                        onClick={() => retrySyncMutation.mutate(log.id)}
                        disabled={retrySyncMutation.isPending}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {retrySyncMutation.isPending ? "Retrying..." : "Retry"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showConnectModal && (
        <ConnectMarketplaceModal
          marketplace={selectedMarketplace}
          onClose={() => {
            setShowConnectModal(false);
            setSelectedMarketplace(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["marketplace-accounts"] });
            setShowConnectModal(false);
            setSelectedMarketplace(null);
          }}
        />
      )}

 {selectedDetailAccount && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div className="max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Sync History - {selectedDetailAccount?.marketplace?.name}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {selectedDetailAccount?.storeName}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSelectedDetailAccount(null)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Tutup
        </button>
      </div>

      <div className="max-h-[70vh] overflow-y-auto">
        {detailLogsLoading ? (
          <div className="flex h-40 items-center justify-center">
            <LoadingSpinner size="md" text="Memuat sync history..." />
          </div>
        ) : detailLogs.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            Belum ada sync history untuk marketplace ini.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {detailLogs.map((log: any) => {
              const status = getLogStatus(log);
              const isFailed = status === "FAILED";
              const result = Array.isArray(log.syncResults)
                ? log.syncResults[0]
                : null;

              return (
                <div key={log.id} className="px-6 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-1",
                          isFailed ? "text-red-600" : "text-green-600"
                        )}
                      >
                        {isFailed ? (
                          <XCircleIcon className="h-5 w-5" />
                        ) : (
                          <CheckCircleIcon className="h-5 w-5" />
                        )}
                      </div>

                      <div>
                        <p className="font-medium text-gray-900">
                          {status}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {formatDateTime(log.syncedAt || log.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-lg bg-gray-50 px-4 py-2">
                        <p className="text-xs text-gray-500">Processed</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {getNumber(result?.processed, getNumber(log.successCount) + getNumber(log.failureCount))}
                        </p>
                      </div>

                      <div className="rounded-lg bg-green-50 px-4 py-2">
                        <p className="text-xs text-green-700">Success</p>
                        <p className="text-lg font-semibold text-green-700">
                          {getNumber(log.successCount)}
                        </p>
                      </div>

                      <div className="rounded-lg bg-red-50 px-4 py-2">
                        <p className="text-xs text-red-700">Failed</p>
                        <p className="text-lg font-semibold text-red-700">
                          {getNumber(log.failureCount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {isFailed && (
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-red-50 px-4 py-3">
                      <p className="text-sm text-red-700">
                        {log.errorMessage || "Sync gagal"}
                      </p>

                      <button
                        type="button"
                        onClick={() => retrySyncMutation.mutate(log.id)}
                        disabled={retrySyncMutation.isPending}
                        className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        {retrySyncMutation.isPending ? "Retrying..." : "Retry"}
                      </button>
                    </div>
                  )}

                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-medium text-gray-500 hover:text-gray-700">
                      Lihat raw sync result
                    </summary>
                    <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-950 p-3 text-xs text-gray-100">
                      {JSON.stringify(log.syncResults, null, 2)}
                    </pre>
                  </details>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  </div>
)}

      {showSyncRulesModal && (
        <SyncRulesModal
          onClose={() => setShowSyncRulesModal(false)}
          onRuleChange={() => {
            queryClient.invalidateQueries({ queryKey: ["sync-rules"] });
          }}
        />
      )}
    </div>
  );
};

export default MarketplacesPage;