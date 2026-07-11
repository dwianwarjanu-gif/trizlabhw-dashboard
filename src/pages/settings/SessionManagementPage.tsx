import { useEffect, useState } from "react";
import { SessionAPI } from "../../services/api";

import {
  ClockIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

export default function SessionManagementPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    try {
      setLoading(true);

      const res = await SessionAPI.getSessions();

      setSessions(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadSessions();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        Loading sessions...
      </div>
    );
  }

  const revokeSession = async (session: any) => {
    if (
      !window.confirm(
        `Logout device ${session.device_name || "ini"}?`
      )
    ) {
      return;
    }

    await SessionAPI.revokeSession(session.id);
    await loadSessions();
  };

  const logoutAllOtherDevices = async () => {
    if (
      !window.confirm(
        "Logout semua device lain? Anda mungkin perlu login ulang di perangkat lain."
      )
    ) {
      return;
    }

    await SessionAPI.logoutAll();
    await loadSessions();
  };

  const getDeviceIcon = (session: Session) => {
    const os = session.os?.toLowerCase() || "";

    if (os.includes("android")) return "📱";
    if (os.includes("iphone")) return "📱";
    if (os.includes("mac")) return "💻";

    return "🖥️";
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">
          Session Management
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          Kelola perangkat yang sedang login ke akun Anda.
        </p>
      </div>

      <button
        onClick={logoutAllOtherDevices}
        className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700"
      >
        Logout All Other Devices
      </button>

      {sessions.map((session) => (
        <div
          key={session.id}
          className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {getDeviceIcon(session)}
                {" "}
                {session.device_name}
              </h2>

              <div className="mt-3 space-y-2 text-sm text-zinc-500">
                <div className="flex items-center gap-2">
                  <GlobeAltIcon className="h-4 w-4 text-zinc-400" />
                  <span>Browser: {session.browser || "-"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <ComputerDesktopIcon className="h-4 w-4 text-zinc-400" />
                  <span>OS: {session.os || "-"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-zinc-400" />
                  <span>IP: {session.ip_address || "-"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-zinc-400" />
                  <span>
                    Last Activity:{" "}
                    {session.last_activity
                      ? new Date(session.last_activity).toLocaleString()
                      : "-"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-zinc-400" />
                  <span>
                    Logged In:{" "}
                    {session.createdAt
                      ? new Date(session.createdAt).toLocaleString()
                      : "-"}
                  </span>
                </div>
              </div>
            </div>

            {session.is_current ? (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Current Device
              </span>
            ) : session.revokedAt ? (
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">
                Revoked
              </span>
            ) : (
              <button
                onClick={() => revokeSession(session)}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Logout Device
              </button>
              
            )}
          </div>
        </div>
      ))}
    </div>
  );
}