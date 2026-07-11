import { useEffect, useState } from "react";
import { stockSyncApi } from "@/services/api";

type StockSyncLog = {
  id: string;
  movement_id: string;
  product_id: string;
  variant_id?: string | null;
  marketplace_code: string;
  marketplace_product_id: string;
  stock_after: number;
  status: "SUCCESS" | "FAILED" | string;
  error_message?: string | null;
  retry_count: number;
  created_at: string;
};

export default function StockSyncLogsPage() {
  const [logs, setLogs] = useState<StockSyncLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await stockSyncApi.getLogs({
        page: 1,
        limit: 20,
        ...(status ? { status } : {}),
      });

      setLogs(res.data?.logs || []);
    } catch (error) {
      console.error(error);
      alert("Gagal memuat stock sync logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [status]);

  const handleRetry = async (id: string) => {
    if (!confirm("Retry sync ini?")) return;

    try {
      setRetryingId(id);
      await stockSyncApi.retryLog(id);
      alert("Retry sync berhasil masuk queue");
      await loadLogs();
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || "Gagal retry sync");
    } finally {
      setRetryingId(null);
    }
  };

  const statusClass = (value: string) => {
    const upper = String(value || "").toUpperCase();

    if (upper === "SUCCESS") {
      return "bg-green-50 text-green-700 border-green-200";
    }

    if (upper === "FAILED") {
      return "bg-red-50 text-red-700 border-red-200";
    }

    return "bg-zinc-50 text-zinc-700 border-zinc-200";
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Stock Sync Logs</h1>
          <p className="text-sm text-zinc-500">
            Pantau histori sinkronisasi stok marketplace dan retry log yang gagal.
          </p>
        </div>

        <div className="flex gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm"
          >
            <option value="">Semua Status</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
          </select>

          <button
            onClick={loadLogs}
            disabled={loading}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:bg-zinc-300"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto" ref={(el) => el?.scrollTo({ left: 0 })}>
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="border-b bg-zinc-50 text-zinc-600">
              <tr>
                <th className="sticky left-0 z-10 bg-zinc-50 px-4 py-3 font-semibold">Tanggal</th>
                <th className="px-4 py-3 font-semibold">Product ID</th>
                <th className="px-4 py-3 font-semibold">Marketplace</th>
                <th className="px-4 py-3 font-semibold">Marketplace Product</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Retry</th>
                <th className="px-4 py-3 font-semibold">Error</th>
                <th className="px-4 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-zinc-500">
                    {loading ? "Memuat logs..." : "Belum ada stock sync log"}
                  </td>
                </tr>
              )}

              {logs.map((log) => (
                <tr key={log.id} className="border-b last:border-b-0 hover:bg-zinc-50">
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-4 py-3 text-zinc-700">
                    {log.created_at
                      ? new Date(log.created_at).toLocaleString("id-ID")
                      : "-"}
                  </td>

                  <td className="max-w-[160px] truncate px-4 py-3 font-mono text-xs" title={log.product_id}
                  >
                    {log.product_id}
                  </td>

                  <td className="px-4 py-3 font-semibold">
                    {log.marketplace_code}
                  </td>

                  <td className="max-w-[150px] truncate px-4 py-3 font-mono text-xs" title={log.marketplace_product_id}>
                    {log.marketplace_product_id}
                  </td>

                  <td className="px-4 py-3">{log.stock_after}</td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(
                        log.status
                      )}`}
                    >
                      {log.status}
                    </span>
                  </td>

                  <td className="px-4 py-3">{log.retry_count || 0}</td>

                  <td className="max-w-[180px] truncate px-4 py-3 text-red-600" title={log.error_message || ""}
                  >
                    {log.error_message || "-"}
                  </td>

                  <td className="px-4 py-3">
                    {String(log.status).toUpperCase() === "FAILED" ? (
                      <button
                        onClick={() => handleRetry(log.id)}
                        disabled={retryingId === log.id}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:bg-zinc-300"
                      >
                        {retryingId === log.id ? "Retrying..." : "Retry"}
                      </button>
                    ) : (
                      <span className="text-zinc-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}