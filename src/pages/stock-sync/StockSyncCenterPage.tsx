import { useEffect, useRef, useState } from "react";
import { stockSyncApi } from "@/services/api";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import toast from "react-hot-toast";

type QueueJob = {
  id: string;
  name: string;
  attemptsMade: number;
  timestamp: number;
  processedOn?: number | null;
  finishedOn?: number | null;
  failedReason?: string | null;
  data?: {
    tenant?: string;
    productId?: string;
    variantId?: string | null;
    stockAfter?: number;
    sourceType?: string;
    reason?: string;
  };
};

type CenterData = {
  counts: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  };
  jobs: {
    waiting: QueueJob[];
    active: QueueJob[];
    failed: QueueJob[];
    completed: QueueJob[];
  };
};

export default function StockSyncCenterPage() {
  const [data, setData] = useState<CenterData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);
  const [removingJobId, setRemovingJobId] = useState<string | null>(null);
  const [retryingAll, setRetryingAll] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const pollingRef = useRef(false);

  const loadCenter = async (silent = false) => {
    if (pollingRef.current) return;

    pollingRef.current = true;

    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await stockSyncApi.getCenter();
      setData(res.data);
    } catch (error: any) {
      console.error(error);

      if (!silent && error?.response?.status !== 429) {
        toast.error("Gagal memuat Stock Sync Center");
      }
    } finally {
      pollingRef.current = false;

      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const SOCKET_URL =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "https://api.trizlabhw.com";

  useEffect(() => {
    loadCenter();

    const timer = setInterval(() => loadCenter(true), 3000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      auth: {
        token: localStorage.getItem("token"),
      },
    });

    socket.on("connect", () => {
      console.log("[STOCK_SYNC_CENTER_SOCKET_CONNECTED]", socket.id);
    });

    socket.on("stock-sync-center-updated", (payload) => {
      console.log("[STOCK_SYNC_CENTER_UPDATED]", payload);

      loadCenter(true);

      if (payload?.type === "failed") {
        toast.error("Stock sync job failed");
      }

      if (payload?.type === "completed") {
        toast.success("Stock sync job completed");
      }
    });

    socket.on("connect_error", (error) => {
      console.error("[STOCK_SYNC_CENTER_SOCKET_ERROR]", error.message);
    });

    return () => {
      socket.off("stock-sync-center-updated");
      socket.disconnect();
    };
  }, []);

  const counts = data?.counts || {
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
    delayed: 0,
    paused: 0,
  };

  const formatDate = (value?: number | null) => {
    if (!value) return "-";
    return new Date(value).toLocaleString("id-ID");
  };

  const handleRetryFailedJob = async (jobId: string) => {
    if (!confirm("Retry failed job ini?")) return;

    try {
      setRetryingJobId(jobId);

      await stockSyncApi.retryFailedJob(jobId);

      toast.success("Failed job berhasil diretry");

      await loadCenter();
    } catch (error: any) {
      console.error(error);
      toast.success(error?.response?.data?.message || "Gagal retry failed job");
    } finally {
      setRetryingJobId(null);
    }
  };
  
  const handleRemoveFailedJob = async (jobId: string) => {
    if (!confirm("Hapus failed job ini dari queue?")) return;

    try {
      setRemovingJobId(jobId);

      await stockSyncApi.removeFailedJob(jobId);

      toast.success("Failed job berhasil dihapus");

      await loadCenter();
    } catch (error: any) {
      console.error(error);
      toast.success(error?.response?.data?.message || "Gagal menghapus failed job");
    } finally {
      setRemovingJobId(null);
    }
  };

  const handleRetryAllFailedJobs = async () => {
    if (!confirm("Retry semua failed jobs?")) return;

    try {
      setRetryingAll(true);

      const res = await stockSyncApi.retryAllFailedJobs();

      toast.success(res.data?.message || "Retry all failed jobs berhasil");

      await loadCenter();
    } catch (error: any) {
      console.error(error);
      toast.success(error?.response?.data?.message || "Gagal retry semua failed jobs");
    } finally {
      setRetryingAll(false);
    }
  };

  const handleClearAllFailedJobs = async () => {
    if (!confirm("Hapus semua failed jobs dari queue?")) return;

    try {
      setClearingAll(true);

      const res = await stockSyncApi.clearAllFailedJobs();

      toast.success(res.data?.message || "Clear all failed jobs berhasil");

      await loadCenter(false);
    } catch (error: any) {
      console.error(error);
      toast.success(error?.response?.data?.message || "Gagal clear semua failed jobs");
    } finally {
      setClearingAll(false);
    }
  };

  const renderJobs = (title: string, jobs: QueueJob[], showActions = false) => (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">10 job terbaru dari queue.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1050px] w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">Job ID</th>
              <th className="px-4 py-3 text-left">Product ID</th>
              <th className="px-4 py-3 text-left">Stock</th>
              <th className="px-4 py-3 text-left">Source</th>
              <th className="px-4 py-3 text-left">Attempts</th>
              <th className="px-4 py-3 text-left">Processed</th>
              <th className="px-4 py-3 text-left">Finished</th>
              <th className="px-4 py-3 text-left">Reason/Error</th>
              {showActions && <th className="px-4 py-3 text-left">Aksi</th>}
            </tr>
          </thead>

          <tbody>
            {jobs.length === 0 && (
              <tr>
                <td
                  colSpan={showActions ? 9 : 8}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  Tidak ada job.
                </td>
              </tr>
            )}

            {jobs.map((job) => (
              <tr key={job.id} className="border-t border-slate-100">
                <td
                  className="w-[220px] max-w-[220px] truncate px-4 py-3 font-mono text-xs"
                  title={job.id}
                >
                  {job.id}
                </td>

                <td
                  className="max-w-[180px] truncate px-4 py-3 font-mono text-xs"
                  title={job.data?.productId || ""}
                >
                  {job.data?.productId || "-"}
                </td>

                <td className="px-4 py-3">{job.data?.stockAfter ?? "-"}</td>

                <td className="px-4 py-3">{job.data?.sourceType || "-"}</td>

                <td className="px-4 py-3">{job.attemptsMade}</td>

                <td className="px-4 py-3">{formatDate(job.processedOn)}</td>

                <td className="px-4 py-3">{formatDate(job.finishedOn)}</td>

                <td
                  className="max-w-[260px] truncate px-4 py-3 text-red-600"
                  title={job.failedReason || job.data?.reason || ""}
                >
                  {job.failedReason || job.data?.reason || "-"}
                </td>

                {showActions && (
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRetryFailedJob(job.id)}
                        disabled={retryingJobId === job.id}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:bg-slate-300"
                      >
                        {retryingJobId === job.id ? "Retrying..." : "Retry"}
                      </button>

                      <button
                        onClick={() => handleRemoveFailedJob(job.id)}
                        disabled={removingJobId === job.id}
                        className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:bg-slate-300"
                      >
                        {removingJobId === job.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stock Sync Center</h1>
          <p className="text-sm text-slate-500">
            Monitor BullMQ queue stock-sync secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-green-600">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
          Live Monitoring
          {refreshing && (
            <span className="text-xs text-slate-400">
              updating...
            </span>
          )}
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleRetryAllFailedJobs}
            disabled={retryingAll || counts.failed === 0}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
          >
            {retryingAll ? "Retrying All..." : "Retry All Failed"}
          </button>

          <button
            onClick={handleClearAllFailedJobs}
            disabled={clearingAll || counts.failed === 0}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
          >
            {clearingAll ? "Clearing..." : "Clear All Failed"}
          </button>

          <button
            onClick={loadCenter}
            disabled={loading}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div> 
      </div>
       
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {[
          ["Waiting", counts.waiting],
          ["Active", counts.active],
          ["Completed", counts.completed],
          ["Failed", counts.failed],
          ["Delayed", counts.delayed],
          ["Paused", counts.paused],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {renderJobs("Active Jobs", data?.jobs?.active || [])}
      {renderJobs("Waiting Jobs", data?.jobs?.waiting || [])}
      {renderJobs("Failed Jobs", data?.jobs?.failed || [], true)}
      {renderJobs("Completed Jobs", data?.jobs?.completed || [])}
    </div>
  );
}