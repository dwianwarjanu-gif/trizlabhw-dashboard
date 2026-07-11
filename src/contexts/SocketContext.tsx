import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { io, Socket } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  "https://api.trizlabhw.com";

type SocketStatus =
  | "connected"
  | "connecting"
  | "reconnecting"
  | "disconnected";

type SocketContextValue = {
  socket: Socket | null;
  status: SocketStatus;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextValue | undefined>(
  undefined
);

let socket: Socket | null = null;

function createSocket() {
  return io(SOCKET_URL, {
    autoConnect: false,
    transports: ["websocket", "polling"],

    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,

    timeout: 20000,
    forceNew: false,
  });
}

export function SocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useAuth();

  const [status, setStatus] =
    useState<SocketStatus>("disconnected");

  const initializedRef = useRef(false);

  const userId =
    (user as any)?.id ||
    (user as any)?.user_id ||
    (user as any)?.userId ||
    null;

  useEffect(() => {
    if (!socket) {
      socket = createSocket();
    }

    if (!socket) return;

    const handleConnect = () => {
      console.log("🟢 SOCKET CONNECTED");

      setStatus("connected");

      if (userId) {
        socket?.emit("join-room", String(userId));

        console.log(
          "🟢 JOIN ROOM:",
          String(userId)
        );
      }
    };

    const handleDisconnect = (reason: string) => {
      console.log("🔴 SOCKET DISCONNECTED:", reason);

      setStatus("disconnected");
    };

    const handleReconnectAttempt = (attempt: number) => {
      console.log(
        "🟡 SOCKET RECONNECTING:",
        attempt
      );

      setStatus("reconnecting");
    };

    const handleReconnect = (attempt: number) => {
      console.log(
        "🟢 SOCKET RECONNECTED:",
        attempt
      );

      setStatus("connected");

      if (userId) {
        socket?.emit("join-room", String(userId));

        console.log(
          "🟢 REJOIN ROOM:",
          String(userId)
        );
      }
    };

    const handleConnectError = (err: any) => {
      console.error(
        "🔴 SOCKET CONNECT ERROR:",
        err?.message
      );

      setStatus("reconnecting");
    };

    socket.on("connect", handleConnect);

    socket.on("disconnect", handleDisconnect);

    socket.on("connect_error", handleConnectError);

    socket.io.on(
      "reconnect_attempt",
      handleReconnectAttempt
    );

    socket.io.on("reconnect", handleReconnect);

    if (isAuthenticated && userId) {
      if (!socket.connected) {
        console.log("🟡 CONNECTING SOCKET...");

        setStatus("connecting");

        socket.connect();
      } else {
        socket.emit("join-room", String(userId));

        setStatus("connected");
      }
    } else {
      console.log("🔴 SOCKET LOGOUT");

      socket.disconnect();

      setStatus("disconnected");
    }

    initializedRef.current = true;

    return () => {
      socket?.off("connect", handleConnect);

      socket?.off("disconnect", handleDisconnect);

      socket?.off(
        "connect_error",
        handleConnectError
      );

      socket?.io.off(
        "reconnect_attempt",
        handleReconnectAttempt
      );

      socket?.io.off(
        "reconnect",
        handleReconnect
      );
    };
  }, [isAuthenticated, userId]);

  const value = useMemo(
    () => ({
      socket,
      status,
      isConnected: status === "connected",
    }),
    [status]
  );

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);

  if (!ctx) {
    throw new Error(
      "useSocket must be used inside SocketProvider"
    );
  }

  return ctx;
}