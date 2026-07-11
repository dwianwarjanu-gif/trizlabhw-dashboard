import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Eye,
  Loader2,
  Package,
  RefreshCcw,
  Search,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import Can from "@/components/auth/Can";
import { ordersApi } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";

type OrderItem = {
  id?: number | string;
  productId?: string;
  sku?: string;
  productName?: string;
  quantity?: number;
  qty?: number;
  price?: number;
  lineTotal?: number;
  subtotal?: number;
};

type Order = {
  id: string;
  orderNumber?: string;
  marketplaceOrderId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  status?: string;
  paymentStatus?: string;
  totalAmount?: number;
  shippingCost?: number;
  orderDate?: string | null;
  createdAt?: string | null;
  items?: OrderItem[];
};

const STATUS_OPTIONS = [
  "UNPAID",
  "NEW",
  "READY_TO_SHIP",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
  "RETURNED",
];

const ORDER_TABS = [
  { label: "Semua Pesanan", value: "ALL" },
  { label: "Belum Dibayar", value: "UNPAID" },
  { label: "Pesanan Baru", value: "NEW" },
  { label: "Siap Kirim", value: "READY_TO_SHIP" },
  { label: "Dikirim", value: "SHIPPED" },
  { label: "Selesai", value: "COMPLETED" },
  { label: "Pembatalan", value: "CANCELLED" },
  { label: "Pengembalian", value: "RETURNED" },
];

const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  ADMIN: ["*"],
  STAFF: [
    "orders.view",
    "orders.detail",
    "orders.update",
    "products.view",
    "inventory.view",
    "marketplaces.view",
  ],
};

function extractOrders(data: any): Order[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.orders)) return data.orders;
  if (Array.isArray(data?.data?.orders)) return data.data.orders;
  return [];
}

function normalizeOrderItem(item: any): OrderItem {
  return {
    id:
      item?.id ??
      item?.order_item_id ??
      `${item?.productId || item?.product_id || "item"}-${Math.random()}`,
    productId: item?.productId ?? item?.product_id,
    sku: item?.sku ?? "-",
    productName: item?.productName ?? item?.product_name ?? item?.name ?? "-",
    quantity: Number(item?.quantity ?? item?.qty ?? 0),
    qty: Number(item?.qty ?? item?.quantity ?? 0),
    price: Number(item?.price ?? 0),
    lineTotal: Number(item?.lineTotal ?? item?.line_total ?? 0),
    subtotal: Number(item?.subtotal ?? 0),
  };
}

function normalizeOrder(raw: any): Order {
  const items = Array.isArray(raw?.items)
    ? raw.items.map(normalizeOrderItem)
    : [];

  return {
    id: String(raw?.id ?? ""),
    orderNumber:
      raw?.orderNumber ??
      raw?.order_number ??
      raw?.invoice_number ??
      raw?.invoiceNumber ??
      "-",
    marketplaceOrderId:
      raw?.marketplaceOrderId ??
      raw?.marketplace_order_id ??
      raw?.externalOrderId ??
      "-",
    customerName:
      raw?.customerName ??
      raw?.customer_name ??
      raw?.buyerName ??
      raw?.buyer_name ??
      "-",
    customerEmail: raw?.customerEmail ?? raw?.customer_email ?? "-",
    customerPhone: raw?.customerPhone ?? raw?.customer_phone ?? "-",
    status: raw?.status ?? "PENDING",
    paymentStatus: raw?.paymentStatus ?? raw?.payment_status ?? "UNPAID",
    totalAmount: Number(
      raw?.totalAmount ??
        raw?.total_amount ??
        raw?.grandTotal ??
        raw?.grand_total ??
        0
    ),
    shippingCost: Number(raw?.shippingCost ?? raw?.shipping_cost ?? 0),
    orderDate:
      raw?.orderDate ?? raw?.order_date ?? raw?.createdAt ?? raw?.created_at ?? null,
    createdAt: raw?.createdAt ?? raw?.created_at ?? null,
    items,
  };
}

function formatCurrency(value?: number) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const { socket, isConnected: socketConnected } = useSocket();

  const { permissions, user } = useAuth();
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const storedPermissions = (() => {
    try {
      return JSON.parse(localStorage.getItem("permissions") || "[]");
    } catch {
      return [];
    }
  })();

  const role = user?.role || storedUser?.role;
  const roleKey = String(role || "").trim().toUpperCase();
  const isAdmin = roleKey === "ADMIN";

  const effectivePermissions = Array.from(
    new Set([
      ...(permissions || []),
      ...(storedPermissions || []),
      ...(ROLE_PERMISSION_MAP[roleKey] || []),
    ])
  );

  const canViewDetail =
    isAdmin ||
    effectivePermissions.includes("*") ||
    effectivePermissions.includes("orders.detail") ||
    effectivePermissions.includes("orders.view");

  const canUpdateOrder =
    isAdmin ||
    effectivePermissions.includes("orders.update") ||
    effectivePermissions.includes("orders.edit");

  const showActions = canViewDetail || canUpdateOrder;

  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("ALL");
  const [selected, setSelected] = useState<Order | null>(null);
  const [statusDraft, setStatusDraft] = useState("PENDING");
  const [orderSyncLive, setOrderSyncLive] = useState<any>(null);

  useEffect(() => {
    if (!socket) return;

    const handleOrderSyncProgress = (payload: any) => {
      setOrderSyncLive(payload);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    };

    socket.on("order-sync-progress", handleOrderSyncProgress);

    return () => {
      socket.off("order-sync-progress", handleOrderSyncProgress);
    };
  }, [socket, queryClient]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await ordersApi.getAll();
      return extractOrders(res.data).map(normalizeOrder);
    },
    refetchOnMount: "always",
    staleTime: 0,
  });

  const orders = data || [];

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();

    return orders.filter((order) => {
      const status = String(order.status || "").toUpperCase();
      const paymentStatus = String(order.paymentStatus || "").toUpperCase();

      const matchTab =
        activeStatus === "ALL" ||
        status === activeStatus ||
        paymentStatus === activeStatus;

      const matchSearch =
        !q ||
        order.orderNumber?.toLowerCase().includes(q) ||
        order.marketplaceOrderId?.toLowerCase().includes(q) ||
        order.customerName?.toLowerCase().includes(q) ||
        order.id?.toLowerCase().includes(q);

      return matchTab && matchSearch;
    });
  }, [orders, search, activeStatus]);

  const openDetail = async (order: Order) => {
    if (!canViewDetail) return;

    try {
      const res = await ordersApi.getById(order.id);
      const payload = res.data?.order || res.data?.data || res.data || order;
      const normalized = normalizeOrder(payload);

      setSelected(normalized);
      setStatusDraft(String(normalized.status || "PENDING").toUpperCase());
    } catch (err) {
      console.error(err);
      setSelected(order);
      setStatusDraft(String(order.status || "PENDING").toUpperCase());
    }
  };

  const syncOrdersMutation = useMutation({
    mutationFn: () => ordersApi.sync(),
    onSuccess: async (res: any) => {
      toast.success(res?.data?.message || "Import order berhasil");
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal import order");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selected) return null;
      return ordersApi.updateStatus(selected.id, statusDraft);
    },
    onSuccess: async () => {
      toast.success("Status order berhasil diupdate");
      await queryClient.invalidateQueries({ queryKey: ["orders"] });

      if (selected) {
        const refreshed = await ordersApi.getById(selected.id).catch(() => null);
        const payload =
          refreshed?.data?.order || refreshed?.data?.data || refreshed?.data;

        if (payload) {
          setSelected(normalizeOrder(payload));
        }
      }

      setSelected(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal update status");
    },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              Orders
            </h1>
            <p className="mt-2 text-zinc-600">
              Kelola seluruh transaksi dan status pesanan toko Anda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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

            <button
              onClick={() => syncOrdersMutation.mutate()}
              disabled={syncOrdersMutation.isPending}
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
            >
              {syncOrdersMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              Import Order
            </button>
          </div>
        </div>

        {orderSyncLive && (
          <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                Order Sync: <strong>{orderSyncLive.status}</strong> •{" "}
                {orderSyncLive.progress || 0}% •{" "}
                {socketConnected ? "WebSocket aktif" : "WebSocket reconnecting"}
              </div>

              <div className="h-2 w-full rounded-full bg-blue-100 sm:w-48">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all"
                  style={{
                    width: `${Math.min(Number(orderSyncLive.progress || 0), 100)}%`,
                  }}
                />
              </div>
            </div>

            {orderSyncLive.message && (
              <p className="mt-2 text-xs text-blue-700">
                {orderSyncLive.message}
              </p>
            )}
          </div>
        )}

        <div className="relative mt-6">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari order number, marketplace order ID, customer, atau ID..."
            className="w-full rounded-2xl border border-zinc-300 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-zinc-900"
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {ORDER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveStatus(tab.value)}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium ${
              activeStatus === tab.value
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        {isLoading ? (
          <div className="py-20 text-center text-zinc-500">Memuat orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center text-zinc-500">
            Belum ada pesanan.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-200">
           <table className="w-full min-w-[980px] divide-y divide-zinc-200">
             <colgroup>
               <col className="w-[260px]" />
               <col className="w-[220px]" />
               <col className="w-[140px]" />
               <col className="w-[150px]" />
               <col className="w-[150px]" />
             {showActions && <col className="w-[190px]" />}
             </colgroup>
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">
                    Tanggal
                  </th>
                  {showActions && (
                    <th className="w-48 px-4 py-3 text-left text-sm font-medium text-zinc-600">
                      Aksi
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100 bg-white">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-4 align-top">
                      <div className="break-words font-medium text-zinc-900">
                        {order.orderNumber || "-"}
                      </div>
                      <div className="mt-1 text-sm text-zinc-500">
                        {order.marketplaceOrderId || "-"}
                      </div>
                    </td>

                    <td className="px-4 py-4 align-top">
                      <div className="break-words font-medium text-zinc-900">
                        {order.customerName || "-"}
                      </div>
                      <div className="mt-1 text-sm text-zinc-500">
                        {order.customerEmail || "-"}
                      </div>
                    </td>

                    <td className="px-4 py-4 align-top">
                      <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
                        {order.status || "-"}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-sm font-medium text-zinc-900">
                      {formatCurrency(
                        Number(order.totalAmount || 0) +
                          Number(order.shippingCost || 0)
                      )}
                    </td>

                    <td className="px-4 py-4 text-sm text-zinc-700">
                      {formatDate(order.orderDate || order.createdAt)}
                    </td>

                    {canViewDetail && (
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-col items-start gap-2">
                          <Can permission="orders.detail">
                            <button
                              onClick={() => openDetail(order)}
                              className="inline-flex items-center gap-2 whitespace-nowrap rounded-2xl border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                            >
                              <Eye className="h-4 w-4" />
                              Detail
                            </button>
                          </Can>

                          {canUpdateOrder && (
                            <button
                              onClick={() => openDetail(order)}
                              className="inline-flex items-center gap-2 whitespace-nowrap rounded-2xl border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Update Status
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900">
                  Detail Order
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {selected.orderNumber || "-"}
                </p>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm text-zinc-500">Status</p>
                <p className="mt-1 font-medium text-zinc-900">
                  {selected.status || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm text-zinc-500">Shipping Cost</p>
                <p className="mt-1 font-medium text-zinc-900">
                  {formatCurrency(selected.shippingCost)}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm text-zinc-500">Customer</p>
                <p className="mt-1 font-medium text-zinc-900">
                  {selected.customerName || "-"}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  {selected.customerEmail || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm text-zinc-500">Tanggal Order</p>
                <p className="mt-1 font-medium text-zinc-900">
                  {formatDate(selected.orderDate || selected.createdAt)}
                </p>
              </div>
            </div>

            {canUpdateOrder && (
              <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm text-zinc-500">Update Status</p>
                <select
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-zinc-900"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <div className="mt-4 flex justify-end gap-3">
                  <button
                    onClick={() => setSelected(null)}
                    className="rounded-2xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Tutup
                  </button>

                  <button
                    onClick={() => updateMutation.mutate()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800"
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Simpan
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-zinc-600" />
                <h3 className="font-semibold text-zinc-900">Item Order</h3>
              </div>

              <div className="mt-4 space-y-3">
                {(selected.items || []).length > 0 ? (
                  selected.items!.map((item, index) => {
                    const qty = Number(item.qty ?? item.quantity ?? 0);
                    const price = Number(item.price ?? 0);
                    const subtotal = Number(
                      item.subtotal ?? item.lineTotal ?? qty * price
                    );

                    return (
                      <div
                        key={`${item.id || item.productId || index}`}
                        className="rounded-2xl border border-zinc-200 bg-white p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="break-words font-medium text-zinc-900">
                              {item.productName || "-"}
                            </div>
                            <div className="mt-1 text-sm text-zinc-500">
                              SKU: {item.sku || "-"}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm text-zinc-500">Qty</div>
                            <div className="break-words font-medium text-zinc-900">
                              {qty}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="text-zinc-500">Subtotal</span>
                          <span className="font-medium text-zinc-900">
                            {formatCurrency(subtotal)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500">
                    Item order kosong.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}