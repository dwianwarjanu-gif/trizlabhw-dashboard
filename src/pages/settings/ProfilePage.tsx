import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  RefreshCcw,
  Save,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { profileApi } from "@/services/api";

type ProfileData = {
  id: string;
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  timezone?: string | null;
  language?: string | null;
  role?: string | null;
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

const defaultForm = {
  name: "",
  phone: "",
  timezone: "Asia/Jakarta",
  language: "id",
  avatar_url: "",
};

function formatDate(value?: string | null) {
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

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(defaultForm);
  const navigate = useNavigate();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await profileApi.getProfile();
      return res.data?.data as ProfileData;
    },
  });

  useEffect(() => {
    if (!data) return;

    setForm({
      name: data.name || "",
      phone: data.phone || "",
      timezone: data.timezone || "Asia/Jakarta",
      language: data.language || "id",
      avatar_url: data.avatar_url || "",
    });
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      return profileApi.updateProfile({
        name: form.name || null,
        phone: form.phone || null,
        timezone: form.timezone || "Asia/Jakarta",
        language: form.language || "id",
        avatar_url: form.avatar_url || null,
      });
    },
    onSuccess: async () => {
      toast.success("Profile berhasil disimpan");
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await refetch();

      const storedUserRaw = localStorage.getItem("user");
      if (storedUserRaw) {
        try {
          const storedUser = JSON.parse(storedUserRaw);
          localStorage.setItem(
            "user",
            JSON.stringify({
              ...storedUser,
              name: form.name,
            })
          );
        } catch {}
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal menyimpan profile");
    },
  });

  const update = (key: keyof typeof defaultForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const initials =
    (form.name || data?.email || "U")
      .split(" ")
      .map((item) => item[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-sm text-zinc-500">
              <UserCircle className="h-4 w-4" />
              Account Profile
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
              Profile
            </h1>
            <p className="mt-2 text-zinc-600">
              Kelola informasi akun, preferensi bahasa, dan timezone.
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

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            {form.avatar_url ? (
              <img
                src={form.avatar_url}
                alt={form.name || data?.email || "Profile"}
                className="h-28 w-28 rounded-full border border-zinc-200 object-cover"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-zinc-900 text-3xl font-bold text-white">
                {initials}
              </div>
            )}

            <h2 className="mt-4 text-xl font-bold text-zinc-900">
              {form.name || data?.email || "-"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {data?.email || "-"}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                {data?.role || "-"}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  data?.status === "ACTIVE"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {data?.status || "-"}
              </span>

              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                TOKOA
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs text-zinc-500">Bergabung sejak</div>
              <div className="mt-1 text-sm font-medium text-zinc-900">
                {formatDate(data?.createdAt)}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs text-zinc-500">Terakhir diperbarui</div>
              <div className="mt-1 text-sm font-medium text-zinc-900">
                {formatDate(data?.updatedAt)}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs text-zinc-500">Member ID</div>
              <div className="mt-1 break-all text-sm font-medium text-zinc-900">
                {data?.id}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs text-zinc-500">Security</div>
                <div className="mt-4 space-y-3">
                <div>
                  <div className="text-xs text-zinc-500">Password</div>
                  <div className="text-sm font-medium text-zinc-900">Protected</div>
                </div>

                <div>
                  <div className="text-xs text-zinc-500">Session</div>
                  <div className="text-sm font-medium text-zinc-900">1 Device Active</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-sm font-semibold text-zinc-900">
                Quick Actions
              </div>

              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => toast("Gunakan menu akun kanan atas untuk Change Password")}
                  className="rounded-xl border border-zinc-200 bg-white p-3 text-left text-sm hover:bg-zinc-100"
                >
                  🔑 Change Password
                </button>

                <button
                  type="button"
                  onClick={() =>
                  navigate("/settings/sessions")
                }
                  className="rounded-xl border border-zinc-200 bg-white p-3 text-left text-sm hover:bg-zinc-100"
                >
                  🖥 Session Management
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/settings/notifications")}
                  className="rounded-xl border border-zinc-200 bg-white p-3 text-left text-sm hover:bg-zinc-100"
                >
                  🔔 Notification Center
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
              Email, role, dan status hanya bisa diubah dari User Management.
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-zinc-600" />
            <h2 className="text-lg font-semibold text-zinc-900">
              Informasi Akun
            </h2>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-zinc-500">
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              <div className="mt-2">Memuat profile...</div>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-700">
                    Nama
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-900"
                    placeholder="Nama lengkap"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-700">
                    Email
                  </label>
                  <input
                    value={data?.email || ""}
                    disabled
                    className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-700">
                    Phone
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-900"
                    placeholder="08123456789"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-700">
                    Avatar URL
                  </label>
                  <input
                    value={form.avatar_url}
                    onChange={(e) => update("avatar_url", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-900"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-700">
                    Timezone
                  </label>
                  <select
                    value={form.timezone}
                    onChange={(e) => update("timezone", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-900"
                  >
                    <option value="Asia/Jakarta">Asia/Jakarta</option>
                    <option value="Asia/Makassar">Asia/Makassar</option>
                    <option value="Asia/Jayapura">Asia/Jayapura</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-700">
                    Language
                  </label>
                  <select
                    value={form.language}
                    onChange={(e) => update("language", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-900"
                  >
                    <option value="id">Indonesia</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-700">
                    Role
                  </label>
                  <input
                    value={data?.role || ""}
                    disabled
                    className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-700">
                    Status
                  </label>
                  <input
                    value={data?.status || ""}
                    disabled
                    className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => updateMutation.mutate()}
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Simpan Perubahan
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}