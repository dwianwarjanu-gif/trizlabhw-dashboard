import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, RefreshCcw, Search, Shield, UserCog } from "lucide-react";
import toast from "react-hot-toast";
import { usersApi } from "@/services/api";

type Role = "ADMIN" | "MANAGER" | "STAFF" | "VIEWER";
type Status = "ACTIVE" | "DISABLED";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  status: Status;
  createdAt?: string;
  updatedAt?: string;
};

const ROLES: Role[] = ["ADMIN", "MANAGER", "STAFF", "VIEWER"];

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF" as Role,
  });
  const [resetPasswords, setResetPasswords] = useState<Record<string, string>>({});

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await usersApi.getAll();
      return (res.data?.data || []) as UserRow[];
    },
  });

  const users = data || [];

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;

    return users.filter((user) =>
      [user.name, user.email, user.role, user.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [search, users]);

  const createMutation = useMutation({
    mutationFn: () => usersApi.create(form),
    onSuccess: async () => {
      toast.success("User berhasil dibuat");
      setForm({ name: "", email: "", password: "", role: "STAFF" });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal membuat user");
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      usersApi.updateRole(id, role),
    onSuccess: async () => {
      toast.success("Role berhasil diubah");
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal mengubah role");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) =>
      usersApi.updateStatus(id, status),
    onSuccess: async () => {
      toast.success("Status user berhasil diubah");
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal mengubah status");
    },
  });

  const passwordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      usersApi.resetPassword(id, password),
    onSuccess: async (_, variables) => {
      toast.success("Password berhasil direset");
      setResetPasswords((prev) => ({ ...prev, [variables.id]: "" }));
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal reset password");
    },
  });

  const createUser = () => {
    if (!form.email || !form.password) {
      toast.error("Email dan password wajib diisi");
      return;
    }

    createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-sm text-zinc-500">
              <UserCog className="h-4 w-4" />
              User Management
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
              Users
            </h1>
            <p className="mt-2 text-zinc-600">
              Kelola user tenant, role, status akun, dan reset password.
            </p>
          </div>

          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-zinc-600" />
          <h2 className="text-lg font-semibold text-zinc-900">Tambah User</h2>
        </div>

        <div className="grid gap-3 lg:grid-cols-5">
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Nama"
            className="rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-900"
          />
          <input
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="Email"
            className="rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-900"
          />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            placeholder="Password"
            className="rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-900"
          />
          <select
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as Role }))}
            className="rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-900"
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <button
            onClick={createUser}
            disabled={createMutation.isPending}
            className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {createMutation.isPending ? "Menyimpan..." : "Tambah User"}
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-zinc-600" />
            <h2 className="text-lg font-semibold text-zinc-900">Daftar User</h2>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari user..."
              className="w-full rounded-2xl border border-zinc-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-zinc-900 lg:w-72"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-zinc-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">Reset Password</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-zinc-500">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                      <div className="mt-2">Memuat user...</div>
                    </td>
                  </tr>
                ) : filteredUsers.length ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-4">
                        <div className="font-medium text-zinc-900">{user.name || "-"}</div>
                        <div className="text-sm text-zinc-500">{user.email}</div>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={user.role}
                          onChange={(e) =>
                            roleMutation.mutate({ id: user.id, role: e.target.value as Role })
                          }
                          className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                        >
                          {ROLES.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() =>
                            statusMutation.mutate({
                              id: user.id,
                              status: user.status === "ACTIVE" ? "DISABLED" : "ACTIVE",
                            })
                          }
                          className={[
                            "rounded-full px-3 py-1 text-xs font-medium",
                            user.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700",
                          ].join(" ")}
                        >
                          {user.status}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <input
                            type="password"
                            value={resetPasswords[user.id] || ""}
                            onChange={(e) =>
                              setResetPasswords((p) => ({
                                ...p,
                                [user.id]: e.target.value,
                              }))
                            }
                            placeholder="Password baru"
                            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                          />
                          <button
                            onClick={() =>
                              passwordMutation.mutate({
                                id: user.id,
                                password: resetPasswords[user.id] || "",
                              })
                            }
                            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50"
                          >
                            Reset
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-zinc-500">
                      Belum ada user.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}