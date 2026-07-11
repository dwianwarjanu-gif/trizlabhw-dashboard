import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  ClockIcon,
  PlayCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PauseCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { queueApi, syncCenterApi } from "@/services/api";
import { useState } from "react";

function getNumber(value: any) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function QueueMonitorPage() {
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();

  const canFetch = Boolean(token) && Boolean(isAuthenticated) && !authLoading;

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["queue-stats"],
    queryFn: queueApi.getStats,
    enabled: canFetch,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    retry: 0,
  });

  const {
    data: syncData,
    refetch: refetchSync,
    isFetching: isFetchingSync,
  } = useQuery({
    queryKey: ["stock-sync-status"],
    queryFn: syncCenterApi.getStatus,
    enabled: canFetch,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    retry: 0,
  });

  const { data: logsData, refetch: refetchLogs } = useQuery({
    queryKey: ["stock-sync-logs"],
    queryFn: () => syncCenterApi.getLogs({ page: 1, limit: 10 }),
    enabled: canFetch,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    retry: 0,
  });
  
  const [logStatusFilter, setLogStatusFilter] =
    useState<"ALL" | "SUCCESS" | "FAILED">("ALL");
  
  const recentLogs = logsData?.data?.rows || [];

  const filteredLogs =
    logStatusFilter === "ALL"
      ? recentLogs
      : recentLogs.filter(
          (log: any) => log.status === logStatusFilter
        );
    
  const stats = data?.data?.stats || data?.stats || {};
  const syncStatus = syncData?.data || {};
  const syncLogs = syncStatus.logs || {};
  const latestFailed = syncStatus.latestFailed;
  const syncQueue = syncStatus.queue || {};

  const retryFailedSync = async () => {
    await syncCenterApi.retryFailed({
      limit: 10,
      maxRetry: 3,
    });

    await refetchSync();
    await refetchLogs();
  };

  const cards = [
    { title: "Waiting", value: getNumber(stats.waiting), icon: ClockIcon },
    { title: "Active", value: getNumber(stats.active), icon: PlayCircleIcon },
    { title: "Completed", value: getNumber(stats.completed), icon: CheckCircleIcon },
    { title: "Failed", value: getNumber(stats.failed), icon: XCircleIcon },
    { title: "Delayed", value: getNumber(stats.delayed), icon: ClockIcon },
    { title: "Paused", value: stats.paused ? "Yes" : "No", icon: PauseCircleIcon },
  ];

  if (authLoading) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-zinc-600">
        Memuat sesi...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              Queue Monitor
            </h1>
            <p className="mt-2 text-zinc-600">
              Pantau status BullMQ background worker dan stock sync engine secara realtime.
            </p>
          </div>

          <button
            onClick={() => {
              refetch();
              refetchSync();
              refetchLogs();
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <ArrowPathIcon
              className={`h-4 w-4 ${isFetching || isFetchingSync ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-zinc-900">
          Stock Sync Center
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
            <p className="text-sm font-medium text-zinc-500">Total Logs</p>
            <p className="mt-2 text-3xl font-bold text-zinc-900">
              {getNumber(syncLogs.total)}
            </p>
          </div>

          <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-700">Success</p>
            <p className="mt-2 text-3xl font-bold text-green-700">
              {getNumber(syncLogs.success)}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">Failed</p>
            <p className="mt-2 text-3xl font-bold text-red-700">
              {getNumber(syncLogs.failed)}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-zinc-900">
          Stock Sync Queue
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-zinc-500">Waiting</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">
              {getNumber(syncQueue.waiting)}
            </p>
          </div>

          <div>
            <p className="text-sm text-zinc-500">Active</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">
              {getNumber(syncQueue.active)}
            </p>
          </div>

          <div>
            <p className="text-sm text-zinc-500">Failed</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">
              {getNumber(syncQueue.failed)}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h3 className="font-semibold text-red-700">Latest Failed Sync</h3>

            {latestFailed ? (
              <div className="mt-3 space-y-2 text-sm text-red-900">
                <p>
                  <span className="font-semibold">Marketplace:</span>{" "}
                  {latestFailed.marketplace_code}
                </p>
                <p>
                  <span className="font-semibold">Product:</span>{" "}
                  {latestFailed.marketplace_product_id}
                </p>
                <p>
                  <span className="font-semibold">Error:</span>{" "}
                  {latestFailed.error_message}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-600">Tidak ada error.</p>
            )}
          </div>

          <button
            onClick={retryFailedSync}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Retry Failed Sync
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-zinc-900">
          <div className="mb-4 flex flex-wrap gap-2">
            {["ALL", "SUCCESS", "FAILED"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() =>
                  setLogStatusFilter(
                    status as "ALL" | "SUCCESS" | "FAILED"
                  )
                }
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  logStatusFilter === status
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          Recent Stock Sync Logs
        </h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500">
                <th className="py-3 pr-4">Marketplace</th>
                <th className="py-3 pr-4">Product</th>
                <th className="py-3 pr-4">Stock</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Error</th>
                <th className="py-3 pr-4">Created</th>
              </tr>
            </thead>

            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-zinc-500">
                    Belum ada log sinkronisasi.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: any) => (
                  <tr key={log.id} className="border-b border-zinc-100">
                    <td className="py-3 pr-4 font-medium">
                      {log.marketplace_code}
                    </td>

                    <td className="py-3 pr-4">
                      {log.marketplace_product_id}
                    </td>

                    <td className="py-3 pr-4">
                      {log.stock_after}
                    </td>

                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          log.status === "SUCCESS"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>

                    <td className="py-3 pr-4 text-red-600">
                      {log.error_message || "-"}
                    </td>

                    <td className="py-3 pr-4 text-zinc-500">
                      {log.created_at
                        ? new Date(log.created_at).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-zinc-600">
          Loading queue stats...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-500">
                      {card.title}
                    </p>
                    <p className="mt-3 text-3xl font-bold text-zinc-900">
                      {card.value}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-zinc-100 p-3">
                    <Icon className="h-6 w-6 text-zinc-700" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}