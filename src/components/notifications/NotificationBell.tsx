import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { notificationsApi } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

type NotificationRow = {
  id: string;
  user_id?: string | null;
  role_key?: string | null;
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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function socketUrl() {
  const base =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "https://api.trizlabhw.com/api";

  return String(base).replace(/\/api\/?$/, "");
}

export default function NotificationBell() {
  const { user, tenant } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications]
  );

  function requestBrowserNotificationPermission() {
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }

  function showBrowserNotification(notification: NotificationRow) {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    new Notification(notification.title || "Notifikasi baru", {
      body: notification.message || "",
      icon: "/favicon.ico",
    });
  }

  function playNotificationSound() {
    try {
      const audio = new Audio("/sounds/notification.mp3");
      audio.volume = 0.35;
      audio.play().catch(() => {});
    } catch {}
  }

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationsApi.getAll({ limit: 20 });
      setNotifications(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user?.id, user?.user_id, user?.role, user?.tenant, tenant, queryClient]);

  useEffect(() => {
    if (!user?.id && !user?.user_id) return;

    const socket = io(socketUrl(), {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      socket.emit("join-notifications", {
        userId: user.id || user.user_id,
        role: user.role,
        tenant: tenant || user.tenant,
      });
    });

    socket.on("notification:new", (notification: NotificationRow) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 20));

      toast.success(notification.title || "Notifikasi baru", {
        duration: 5000,
      });

      showBrowserNotification(notification);
      playNotificationSound();
   });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, user?.user_id, user?.role, user?.tenant, tenant]);

  const markRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_read: 1 } : item
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, is_read: 1 }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const getNotificationPath = (item: NotificationRow) => {
    if (item.type === "USER_ROLE_UPDATED") return "/settings/users";
    if (item.type === "LOW_STOCK") return "/inventory";
    if (item.type === "MARKETPLACE_SYNC_FAILED") return "/marketplaces";
    if (item.type === "PASSWORD_RESET") return "/settings/users";

    return "/settings/notifications";
  };

  const handleNotificationClick = async (item: NotificationRow) => {
    try {
      if (!item.is_read) {
        await notificationsApi.markRead(item.id);

        setNotifications((prev) =>
          prev.map((row) =>
            row.id === item.id ? { ...row, is_read: 1 } : row
          )
        );

        queryClient.invalidateQueries({ queryKey: ["notifications-page"] });
      }

      setOpen(false);
      navigate(getNotificationPath(item));
    } catch (err) {
      console.error(err);
      setOpen(false);
      navigate(getNotificationPath(item));
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          requestBrowserNotificationPermission();
          setOpen((prev) => !prev);
        }}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-100"
        aria-label="Notification"
      >
        <Bell className="h-5 w-5 text-slate-700" />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-[360px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <div className="font-semibold text-slate-900">Notifications</div>
              <div className="text-xs text-slate-500">
                {unreadCount} belum dibaca
              </div>
            </div>

            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              <CheckCheck className="h-4 w-4" />
              Read all
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-6 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Memuat...
              </div>
            ) : notifications.length ? (
              notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNotificationClick(item)}
                  className={[
                    "block w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50",
                    item.is_read ? "bg-white" : "bg-blue-50/60",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {item.title}
                      </div>
                      <div className="mt-1 line-clamp-2 text-xs text-slate-600">
                        {item.message || "-"}
                      </div>
                    </div>

                    {!item.is_read && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-slate-400">
                    <span>{item.type}</span>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-6 text-center text-sm text-slate-500">
                Belum ada notifikasi.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}