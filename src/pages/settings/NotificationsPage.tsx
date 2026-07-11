import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Bell, 
  CheckCheck, 
  Loader2, 
  RefreshCcw,
  UserCog,
  AlertTriangle,
  RefreshCw,
  KeyRound, 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notificationsApi } from "@/services/api";
import toast from "react-hot-toast";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  is_read: number;
  createdAt?: string;
  readAt?: string | null;
};

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const handleNotificationClick = async (item: any) => {
    try {
      if (!item.is_read) {
        await notificationsApi.markRead(item.id);
      }

      navigate(getNotificationPath(item));
    } catch (err) {
      console.error(err);
      navigate(getNotificationPath(item));
    }
  };

  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "READ">("ALL");

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["notifications-page"],
    queryFn: async () => {
      const res = await notificationsApi.getAll({ limit: 100 });
      return (res.data?.data || []) as NotificationRow[];
    },
  });

  const notifications = data || [];

  const filtered = useMemo(() => {
    if (filter === "UNREAD") return notifications.filter((n) => !n.is_read);
    if (filter === "READ") return notifications.filter((n) => n.is_read);
    return notifications;
  }, [notifications, filter]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const todayNotifications = filtered.filter((n) => {
    const d = new Date(n.createdAt || "");
    return d.toDateString() === new Date().toDateString();
  });

  const olderNotifications = filtered.filter((n) => {
    const d = new Date(n.createdAt || "");
    return d.toDateString() !== new Date().toDateString();
  });

  const markRead = async (id: string) => {
    await notificationsApi.markRead(id);
    await queryClient.invalidateQueries({ queryKey: ["notifications-page"] });
  };

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    toast.success("Semua notifikasi ditandai dibaca");
    await queryClient.invalidateQueries({ queryKey: ["notifications-page"] });
  };

  const handleView = (item: NotificationRow) => {
    if (item.type === "USER_ROLE_UPDATED") navigate("/settings/users");
    else if (item.type === "MARKETPLACE_SYNC_FAILED") navigate("/marketplaces");
    else if (item.type === "LOW_STOCK") navigate("/inventory");
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Hapus notification ini?")) return;

    await notificationsApi.delete(id);
    toast.success("Notification dihapus");
    await queryClient.invalidateQueries({ queryKey: ["notifications-page"] });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "USER_ROLE_UPDATED":
        return <UserCog className="h-5 w-5 text-blue-600" />;

      case "LOW_STOCK":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;

      case "MARKETPLACE_SYNC_FAILED":
        return <RefreshCw className="h-5 w-5 text-red-500" />;

      case "PASSWORD_RESET":
        return <KeyRound className="h-5 w-5 text-purple-500" />;

      default:
        return <Bell className="h-5 w-5 text-zinc-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "USER_ROLE_UPDATED":
        return "bg-blue-100 text-blue-700";

      case "LOW_STOCK":
        return "bg-orange-100 text-orange-700";

      case "MARKETPLACE_SYNC_FAILED":
        return "bg-red-100 text-red-700";

      case "PASSWORD_RESET":
        return "bg-purple-100 text-purple-700";

      default:
        return "bg-zinc-100 text-zinc-700";
    }
  };

  const getRelativeTime = (value?: string) => {
    if (!value) return "-";

    const diff = Date.now() - new Date(value).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Baru saja";
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days === 1) return "Kemarin";

    return `${days} hari lalu`;
  };

  const renderCard = (item: NotificationRow) => (
    <div
      key={item.id}
      onClick={() => handleNotificationClick(item)}
      className={`cursor-pointer border-t px-4 py-3 transition hover:bg-zinc-50 ${
        !item.is_read ? "bg-blue-50" : "bg-white"
      }`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
              {getNotificationIcon(item.type)}

              <div className="flex items-center gap-2">
                {!item.is_read && (
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                )}

                <h3 className="font-semibold text-zinc-900">
                  {item.title}
                </h3>
             </div>
          </div>

          <p className="mt-1 text-sm text-zinc-600">{item.message || "-"}</p>

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${getTypeBadge(
                item.type
              )}`}
            >
              {item.type}
            </span>
            <span>•</span>
            <span>{getRelativeTime(item.createdAt)}</span>
            {item.entity_type && (
              <>
                <span>•</span>
                <span>{item.entity_type}</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {!item.is_read && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                markRead(item.id);
              }}             
              className="rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-white"
            > 
              Mark Read
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();  
              handleView(item);
            }}
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            View
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item.id);
            }}
            className="rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  const getNotificationPath = (item: any) => {
    if (item.type === "USER_ROLE_UPDATED") return "/settings/users";
    if (item.type === "LOW_STOCK") return "/inventory";
    if (item.type === "MARKETPLACE_SYNC_FAILED") return "/marketplaces";
    if (item.type === "PASSWORD_RESET") return "/settings/users";

    return "/settings/notifications";
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-sm text-zinc-500">
              <Bell className="h-4 w-4" />
              Notification Center
            </div>
            <h1 className="mt-2 text-3xl font-bold text-zinc-900">Notifications</h1>
            <p className="mt-2 text-zinc-600">
              Kelola semua notifikasi sistem dan aktivitas akun.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-300 px-4 py-3 text-sm font-medium hover:bg-zinc-50"
            >
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Refresh
            </button>

            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800"
            >
              <CheckCheck className="h-4 w-4" />
              Mark All Read
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          ["ALL", `Semua (${notifications.length})`],
          ["UNREAD", `Belum Dibaca (${unreadCount})`],
          ["READ", `Dibaca (${notifications.length - unreadCount})`],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
              filter === key
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        {isLoading ? (
          <div className="py-16 text-center text-zinc-500">
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            <div className="mt-2">Memuat notifikasi...</div>
          </div>
        ) : filtered.length ? (
          <div className="space-y-6">
            {todayNotifications.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-zinc-500">Today</h3>
                <div className="space-y-3">{todayNotifications.map(renderCard)}</div>
              </>
            )}

            {olderNotifications.length > 0 && (
              <>
                <h3 className="pt-4 text-sm font-semibold text-zinc-500">Earlier</h3>
                <div className="space-y-3">{olderNotifications.map(renderCard)}</div>
              </>
            )}
          </div>
        ) : (
          <div className="py-16 text-center text-zinc-500">
            <Bell className="mx-auto h-10 w-10 text-zinc-300" />
            <div className="mt-3 font-medium">Belum ada notifikasi</div>
            <div className="mt-1 text-sm">Notifikasi sistem akan muncul di sini.</div>
          </div>
        )}
      </div>
    </div>
  );
}