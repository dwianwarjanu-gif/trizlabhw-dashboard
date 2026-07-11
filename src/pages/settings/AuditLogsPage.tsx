import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Clock3,
  Filter,
  Loader2,
  RefreshCcw,
  Search,
} from "lucide-react";
import { auditLogsApi } from "@/services/api";

type AuditLog = {
  id: string;
  actor_email?: string | null;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  entity_label?: string | null;
  before_data?: any;
  after_data?: any;
  ip_address?: string | null;
  user_agent?: string | null;
  createdAt?: string;
};

const ACTIONS = [
  "CREATE_USER",
  "UPDATE_USER_ROLE",
  "UPDATE_USER_STATUS",
  "RESET_USER_PASSWORD",
];

function getActionBadge(action: string) {
  switch (action) {
    case "CREATE_USER":
      return "bg-emerald-100 text-emerald-700";

    case "UPDATE_USER_ROLE":
      return "bg-amber-100 text-amber-700";

    case "UPDATE_USER_STATUS":
      return "bg-red-100 text-red-700";

    case "RESET_USER_PASSWORD":
      return "bg-blue-100 text-blue-700";

    default:
      return "bg-zinc-100 text-zinc-700";
  }
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function prettyJson(value: any) {
  if (!value) return "-";
  return JSON.stringify(value, null, 2);
}

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["audit-logs", action],
    queryFn: async () => {
      const res = await auditLogsApi.getAll({
        limit: 100,
        action: action || undefined,
      });
      return (res.data?.data || []) as AuditLog[];
    },
  });

  const logs = data || [];

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;

    return logs.filter((log) =>
      [
        log.actor_email,
        log.action,
        log.entity_type,
        log.entity_label,
        log.ip_address,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [logs, search]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-sm text-zinc-500">
              <Activity className="h-4 w-4" />
              System Activity
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
              Audit Logs
            </h1>
            <p className="mt-2 text-zinc-600">
              Pantau aktivitas penting seperti create user, ubah role, disable user, dan reset password.
            </p>
          </div>

          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari actor, action, entity..."
              className="w-full rounded-2xl border border-zinc-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-zinc-900 lg:w-80"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full rounded-2xl border border-zinc-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-zinc-900 lg:w-72"
            >
              <option value="">Semua Action</option>
              {ACTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-zinc-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">Waktu</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">Actor</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">Action</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">Entity</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">IP</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                      <div className="mt-2">Memuat audit logs...</div>
                    </td>
                  </tr>
                ) : filteredLogs.length ? (
                  filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelected(log)}
                      className="cursor-pointer hover:bg-zinc-50 transition-colors"
                    >
                      <td className="px-4 py-4 text-sm text-zinc-700">
                        <div className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-zinc-400" />
                          {formatDate(log.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-zinc-700">
                        {log.actor_email || "-"}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium shadow-sm ${getActionBadge(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-zinc-700">
                        <div className="font-medium">{log.entity_label || "-"}</div>
                        <div className="text-xs text-zinc-400">{log.entity_type || "-"}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-zinc-500">
                        {log.ip_address || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                      Belum ada audit log.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900">Detail Audit Log</h2>
                <p className="mt-1 text-sm text-zinc-500">{selected.id}</p>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="rounded-2xl border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
              >
                Tutup
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Info label="Waktu" value={formatDate(selected.createdAt)} />
              <Info label="Actor" value={selected.actor_email || "-"} />
              <Info label="Action" value={selected.action} />
              <Info label="Entity" value={selected.entity_label || "-"} />
              <Info label="Entity Type" value={selected.entity_type || "-"} />
              <Info label="IP Address" value={selected.ip_address || "-"} />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <JsonBox title="Before" value={selected.before_data} />
              <JsonBox title="After" value={selected.after_data} />
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-sm font-medium text-zinc-900">User Agent</div>
              <div className="mt-2 break-all text-sm text-zinc-600">
                {selected.user_agent || "-"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="text-sm text-zinc-500">{label}</div>
      <div className="mt-1 break-all font-medium text-zinc-900">{value}</div>
    </div>
  );
}

function JsonBox({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="text-sm font-medium text-zinc-900">{title}</div>
      <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-white p-3 text-xs text-zinc-700">
        {prettyJson(value)}
      </pre>
    </div>
  );
}