import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Filter,
  Lock,
  Loader2,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
  RefreshCcw,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "@/services/api";
import {
  hasPermission,
  type Permission,
  type Role,
} from "@/config/permissions";

type PermissionItem = {
  key: Permission;
  label: string;
  description: string;
  group: string;
};

type PermissionGroup = {
  group: string;
  items: PermissionItem[];
};

type PermissionMatrix = Record<Role, Permission[]>;

type RolePermissionsResponse = {
  roles: Role[];
  permissions: Array<{
    key: Permission;
    label: string;
    group: string;
    description?: string;
  }>;
  matrix: PermissionMatrix;
};

const ROLES: Role[] = ["ADMIN", "MANAGER", "STAFF", "VIEWER"];

const ROLE_META: Record<Role, { title: string; subtitle: string; badge: string }> = {
  ADMIN: {
    title: "Admin",
    subtitle: "Akses penuh semua fitur",
    badge: "Full Access",
  },
  MANAGER: {
    title: "Manager",
    subtitle: "Operasional dan analytics",
    badge: "Operational",
  },
  STAFF: {
    title: "Staff",
    subtitle: "Operasional terbatas",
    badge: "Limited",
  },
  VIEWER: {
    title: "Viewer",
    subtitle: "Hanya lihat data dasar",
    badge: "Read Only",
  },
};

function createEmptyMatrix(): PermissionMatrix {
  return {
    ADMIN: [],
    MANAGER: [],
    STAFF: [],
    VIEWER: [],
  };
}

function normalizePermissions(items: Permission[] = []) {
  return Array.from(new Set(items)).sort();
}

function sameMatrix(a: PermissionMatrix, b: PermissionMatrix) {
  return ROLES.every((role) => {
    const left = normalizePermissions(a[role] || []);
    const right = normalizePermissions(b[role] || []);
    if (left.length !== right.length) return false;
    return left.every((value, index) => value === right[index]);
  });
}

function getRoleBadgeClass(role: Role) {
  switch (role) {
    case "ADMIN":
      return "border-zinc-900 bg-zinc-900 text-white";
    case "MANAGER":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "STAFF":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "VIEWER":
      return "border-zinc-200 bg-zinc-100 text-zinc-700";
    default:
      return "border-zinc-200 bg-zinc-100 text-zinc-700";
  }
}

function buildGroups(rows: RolePermissionsResponse["permissions"]): PermissionGroup[] {
  const map = new Map<string, PermissionItem[]>();

  for (const row of rows) {
    const group = row.group || "Lainnya";
    const items = map.get(group) || [];

    items.push({
      key: row.key,
      label: row.label,
      description: row.description || "",
      group,
    });

    map.set(group, items);
  }

  return Array.from(map.entries()).map(([group, items]) => ({
    group,
    items,
  }));
}

export default function RolePermissionsPage() {
  const queryClient = useQueryClient();

  const [selectedRole, setSelectedRole] = useState<Role>("ADMIN");
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [draftMatrix, setDraftMatrix] = useState<PermissionMatrix>(createEmptyMatrix());

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["role-permissions"],
    queryFn: async () => {
      const res = await api.get<RolePermissionsResponse>("/admin/role-permissions");
      return res.data;
    },
  });

  useEffect(() => {
    if (!data?.matrix) return;

    const nextMatrix = createEmptyMatrix();

    for (const role of ROLES) {
      nextMatrix[role] = normalizePermissions(data.matrix[role] || []);
    }

    setDraftMatrix(nextMatrix);
  }, [data]);

  const permissionGroups = useMemo(() => {
    return buildGroups(data?.permissions || []);
  }, [data]);

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();

    return permissionGroups.filter((group) => {
      const groupMatches =
        groupFilter === "all" || group.group === groupFilter;

      const queryMatches =
        !query ||
        group.group.toLowerCase().includes(query) ||
        group.items.some(
          (item) =>
            item.label.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.key.toLowerCase().includes(query)
        );

      return groupMatches && queryMatches;
    });
  }, [groupFilter, search, permissionGroups]);

  const totalPermissions = useMemo(
    () => permissionGroups.flatMap((group) => group.items).length,
    [permissionGroups]
  );

  const activeCount = useMemo(
    () => normalizePermissions(draftMatrix[selectedRole] || []).length,
    [draftMatrix, selectedRole]
  );

  const coveragePercent = totalPermissions > 0
    ? Math.round((activeCount / totalPermissions) * 100)
    : 0;

  const roleScore = (role: Role) => normalizePermissions(draftMatrix[role] || []).length;

  const isDirty = useMemo(() => {
    if (!data?.matrix) return false;

    const baseline: PermissionMatrix = createEmptyMatrix();
    for (const role of ROLES) {
      baseline[role] = normalizePermissions(data.matrix[role] || []);
    }

    return !sameMatrix(baseline, draftMatrix);
  }, [data?.matrix, draftMatrix]);

  const togglePermission = (role: Role, permission: Permission) => {
    setDraftMatrix((prev) => {
      const current = new Set(prev[role] || []);

      if (current.has(permission)) {
        current.delete(permission);
      } else {
        current.add(permission);
      }

      return {
        ...prev,
        [role]: normalizePermissions(Array.from(current)),
      };
    });
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: PermissionMatrix) => {
      await Promise.all(
        ROLES.map((role) =>
          api.put(`/admin/role-permissions/${role}`, {
            permissions: payload[role] || [],
          })
        )
      );
    },
    onSuccess: async () => {
      toast.success("Permission berhasil disimpan.");
      await queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      await refetch();
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          "Gagal menyimpan permission."
      );
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      await api.post("/admin/role-permissions/reset");
    },
    onSuccess: async () => {
      toast.success("Default role permissions dipulihkan.");
      await queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      await refetch();
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          "Gagal menjalankan auto preset."
      );
    },
  });

  const handleSave = () => {
    saveMutation.mutate(draftMatrix);
  };

  const handleAutoPreset = () => {
    resetMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-sm text-zinc-500">
              <ShieldCheck className="h-4 w-4" />
              Role Permission Matrix
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
              Permissions
            </h1>
            <p className="mt-2 text-zinc-600">
              Atur akses per role untuk menu, aksi, dan halaman di seluruh dashboard.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAutoPreset}
              disabled={resetMutation.isPending}
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resetMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Auto preset
            </button>

            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Simpan perubahan
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {ROLES.map((role) => {
          const total = roleScore(role);
          const meta = ROLE_META[role];

          return (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={[
                "rounded-3xl border p-5 text-left shadow-sm transition",
                selectedRole === role
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm opacity-80">{meta.title}</p>
                  <p className="mt-2 text-2xl font-bold">{total}</p>
                  <p className="mt-2 text-sm opacity-80">{meta.subtitle}</p>
                </div>
                <div
                  className={[
                    "rounded-2xl border px-3 py-1 text-xs font-medium",
                    selectedRole === role
                      ? "border-white/20 bg-white/10 text-white"
                      : getRoleBadgeClass(role),
                  ].join(" ")}
                >
                  {meta.badge}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-zinc-600" />
            <h2 className="text-lg font-semibold text-zinc-900">
              Role Preview
            </h2>
          </div>

          <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-zinc-500">Selected Role</p>
                <p className="mt-1 text-xl font-bold text-zinc-900">
                  {selectedRole}
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700">
                {ROLE_META[selectedRole].badge}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs text-zinc-500">Akses aktif</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  {activeCount} / {totalPermissions}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs text-zinc-500">Coverage</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  {coveragePercent}%
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
                Klik setiap kotak permission untuk mengaktifkan / menonaktifkan akses per role.
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Admin punya akses penuh.
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Manager bisa operasional dan analytics.
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Staff fokus ke operasional dasar.
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Matrix Permission
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Centang akses per role sesuai kebutuhan operasional.
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari permission..."
                  className="w-full rounded-2xl border border-zinc-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-zinc-900 lg:w-72"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-zinc-900 lg:w-56"
                >
                  <option value="all">Semua Grup</option>
                  {permissionGroups.map((group) => (
                    <option key={group.group} value={group.group}>
                      {group.group}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-zinc-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">
                      Permission
                    </th>
                    {ROLES.map((role) => (
                      <th
                        key={role}
                        className="px-4 py-3 text-center text-sm font-medium text-zinc-600"
                      >
                        {role}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100 bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                        <div className="mt-2">Memuat matrix permission...</div>
                      </td>
                    </tr>
                  ) : filteredGroups.length > 0 ? (
                    filteredGroups.map((group) => (
                      <tr key={group.group}>
                        <td className="px-4 py-5 align-top">
                          <div className="font-semibold text-zinc-900">
                            {group.group}
                          </div>
                          <div className="mt-2 space-y-3">
                            {group.items.map((item) => (
                              <div key={item.key} className="max-w-xl">
                                <div className="text-sm font-medium text-zinc-800">
                                  {item.label}
                                </div>
                                <div className="text-xs text-zinc-500">
                                  {item.description}
                                </div>
                                <div className="mt-1 text-xs text-zinc-400">
                                  {item.key}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>

                        {ROLES.map((role) => (
                          <td key={`${group.group}-${role}`} className="px-4 py-5 align-top">
                            <div className="space-y-3">
                              {group.items.map((item) => {
                                const allowed = hasPermission(role, item.key);

                                return (
                                  <button
                                    key={`${role}-${item.key}`}
                                    type="button"
                                    onClick={() => togglePermission(role, item.key)}
                                    className={[
                                      "flex w-full items-center justify-center rounded-2xl border px-3 py-3 transition",
                                      allowed
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                        : "border-zinc-200 bg-zinc-50 text-zinc-400 hover:bg-zinc-100",
                                    ].join(" ")}
                                  >
                                    {allowed ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      <Lock className="h-4 w-4" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                        Tidak ada permission yang cocok dengan filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                <Check className="h-4 w-4 text-emerald-600" />
                Allowed
              </div>
              <p className="mt-2 text-sm text-zinc-600">
                Permission aktif untuk role tersebut.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                <Lock className="h-4 w-4 text-zinc-500" />
                Locked
              </div>
              <p className="mt-2 text-sm text-zinc-600">
                Permission belum diberikan pada role.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                <SlidersHorizontal className="h-4 w-4 text-zinc-500" />
                Editable
              </div>
              <p className="mt-2 text-sm text-zinc-600">
                Perubahan bisa disimpan langsung ke backend.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {isDirty
              ? "Ada perubahan yang belum disimpan."
              : "Matrix sudah sinkron dengan backend."}
          </div>
        </div>
      </div>
    </div>
  );
}