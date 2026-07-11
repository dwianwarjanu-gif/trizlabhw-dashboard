import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Loader2,
  Package,
  RefreshCcw,
  ShoppingBag,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAuth } from "@/contexts/AuthContext";

import api from "@/services/api";
import { OrderRow, type OrderRowData } from "@/components/orders/OrderRow";

type Product = {
  id: string;
  sku?: string;
  name?: string;
  price?: number;
  stock?: number;
  availableStock?: number;
  minStockLevel?: number;
  createdAt?: string;
  updatedAt?: string;
};

type InventoryItem = {
  productId: string;
  productName?: string;
  sku?: string;
  price?: number;
  stock?: number;
  availableStock?: number;
  reservedStock?: number;
  minStockLevel?: number;
  updatedAt?: string | null;
};

type OrderItem = {
  id?: number | string;
  orderId?: string;
  productId?: string;
  sku?: string;
  productName?: string;
  quantity?: number;
  price?: number;
  lineTotal?: number;
  createdAt?: string;
};

type Order = OrderRowData & {
  marketplaceOrderId?: string;
  items?: OrderItem[];
  itemsCount?: number;
};

const PIE_COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];

function extractProducts(data: any): Product[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function extractInventory(data: any): InventoryItem[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.inventory)) return data.inventory;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function extractOrders(data: any): Order[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.orders)) return data.orders;
  if (Array.isArray(data?.data?.orders)) return data.data.orders;
  return [];
}

function normalizeOrder(row: any): Order {
  return {
    id: row.id ?? "",
    orderNumber: row.orderNumber ?? row.order_number ?? "-",
    marketplaceOrderId: row.marketplaceOrderId ?? row.marketplace_order_id ?? "-",
    status: row.status ?? "PENDING",
    totalAmount: Number(row.totalAmount ?? row.total_amount ?? 0),
    shippingCost: Number(row.shippingCost ?? row.shipping_cost ?? 0),
    orderDate: row.orderDate ?? row.order_date ?? null,
    createdAt: row.createdAt ?? row.created_at ?? null,
    items: Array.isArray(row.items) ? row.items : [],
    itemsCount: Number(row.itemsCount ?? row.items_count ?? 0),
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

function formatChartDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  });
}

function toLocalDateKey(value: string | Date) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;
}

function getStatusLabel(status?: string) {
  const s = String(status || "").toUpperCase();
  if (s.includes("PENDING")) return "Pending";
  if (s.includes("PAID")) return "Paid";
  if (s.includes("SHIPPED")) return "Shipped";
  if (s.includes("DELIVERED")) return "Delivered";
  if (s.includes("CANCELLED")) return "Cancelled";
  if (s.includes("REFUNDED")) return "Refunded";
  return s || "-";
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      setSize({
        width: el.clientWidth,
        height: el.clientHeight,
      });
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return [ref, size] as const;
}

export default function DashboardPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const { permissions } = useAuth();

  const canViewInventory = permissions.includes("inventory.view");
  const canViewAnalytics = permissions.includes("analytics.view");

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const [productsRes, ordersRes, inventoryRes] = await Promise.all([
        api.get("/products"),
        api.get("/orders"),
        canViewInventory
          ? api.get("/inventory")
          : Promise.resolve({ data: { inventory: [] } }),
      ]);

      const products = extractProducts(productsRes.data);
      const inventory = extractInventory(inventoryRes.data);
      const orders = extractOrders(ordersRes.data).map(normalizeOrder);

      return {
        products,
        inventory,
        orders,
      };
    },
  });

  const products = data?.products ?? [];
  const inventory = data?.inventory ?? [];
  const orders = data?.orders ?? [];

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => {
        const aTime = new Date(a.orderDate || a.createdAt || "").getTime() || 0;
        const bTime = new Date(b.orderDate || b.createdAt || "").getTime() || 0;
        return bTime - aTime;
      })
      .slice(0, 4);
  }, [orders]);

  const totalProducts = products.length;
  const totalOrders = orders.length;
  const totalSales = orders.reduce((sum, order) => {
    const base = Number(order.totalAmount || 0);
    const shipping = Number(order.shippingCost || 0);
    return sum + base + shipping;
  }, 0);

  const lowStockCount = inventory.filter((item) => {
    const stock = Number(item.stock || 0);
    const minStock = Number(item.minStockLevel || 0);
    return stock > 0 && stock <= minStock;
  }).length;

  const emptyStockCount = inventory.filter(
    (item) => Number(item.stock || 0) <= 0
  ).length;

  const pendingOrders = orders.filter((order) => {
    const s = String(order.status || "").toLowerCase();
    return s.includes("pending") || s.includes("menunggu");
  }).length;

  const statusBreakdown = useMemo(() => {
    const map = new Map<string, number>();

    orders.forEach((order) => {
      const label = getStatusLabel(order.status);
      map.set(label, (map.get(label) || 0) + 1);
    });

    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const inventoryBreakdown = useMemo(() => {
    let safe = 0;
    let low = 0;
    let empty = 0;

    inventory.forEach((item) => {
      const stock = Number(item.stock || 0);
      const minStock = Number(item.minStockLevel || 0);

      if (stock <= 0) empty += 1;
      else if (stock <= minStock) low += 1;
      else safe += 1;
    });

    return [
      { name: "Aman", value: safe },
      { name: "Rendah", value: low },
      { name: "Habis", value: empty },
    ].filter((item) => item.value > 0);
  }, [inventory]);

  const dailySales = useMemo(() => {
    const days: { key: string; label: string; amount: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push({
        key: toLocalDateKey(d),
        label: formatChartDate(d.toISOString()),
        amount: 0,
      });
    }

    orders.forEach((order) => {
      const rawDate = order.orderDate || order.createdAt;
      if (!rawDate) return;

      const key = toLocalDateKey(rawDate);
      const day = days.find((item) => item.key === key);
      if (!day) return;

      day.amount +=
        Number(order.totalAmount || 0) + Number(order.shippingCost || 0);
    });

    return days.map(({ label, amount }) => ({
      name: label,
      amount,
    }));
  }, [orders]);

  const [salesChartRef, salesChartSize] = useElementSize<HTMLDivElement>();
  const [statusChartRef, statusChartSize] = useElementSize<HTMLDivElement>();
  const [inventoryChartRef, inventoryChartSize] = useElementSize<HTMLDivElement>();

  const topProducts = [...inventory]
    .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
    .slice(0, 5);

  const openDetail = async (order: Order) => {
    try {
      setIsLoadingDetail(true);

      const res = await api.get(`/orders/${order.id}`);
      const payload = res.data?.order || res.data?.data || order;

      setSelectedOrder(payload);
      setIsDetailOpen(true);
    } catch (err) {
      console.error(err);
      setSelectedOrder(order);
      setIsDetailOpen(true);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setSelectedOrder(null);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-sm text-zinc-500">
              <BarChart3 className="h-4 w-4" />
              Dashboard Overview
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
              Dashboard
            </h1>
            <p className="mt-2 text-zinc-600">
              Ringkasan performa toko, status pesanan, dan kondisi operasional terbaru.
            </p>
          </div>

          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
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

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-zinc-500">Total Produk</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-900">
                {isLoading ? "..." : totalProducts}
              </p>
              <p className="mt-3 text-sm text-zinc-500">Produk terdaftar</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 p-3 text-zinc-500">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-zinc-500">Total Pesanan</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-900">
                {isLoading ? "..." : totalOrders}
              </p>
              <p className="mt-3 text-sm text-zinc-500">Pesanan masuk</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 p-3 text-zinc-500">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-zinc-500">Stok Rendah</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-900">
                {isLoading ? "..." : lowStockCount}
              </p>
              <p className="mt-3 text-sm text-zinc-500">Perlu dicek ulang</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 p-3 text-zinc-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-zinc-500">Sistem</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-900">
                {isError ? "OFFLINE" : "ONLINE"}
              </p>
              <p className="mt-3 text-sm text-zinc-500">Backend aktif</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 p-3 text-zinc-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

    {canViewAnalytics && (
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-zinc-600" />
            <h2 className="text-lg font-semibold text-zinc-900">
              Analytics
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="mb-3">
                <p className="text-sm font-medium text-zinc-900">
                  Penjualan 7 Hari Terakhir
                </p>
                <p className="text-xs text-zinc-500">
                  Total order value + ongkir per hari
                </p>
              </div>

              <div ref={salesChartRef} className="h-72 min-h-[288px]">
                {salesChartSize.width > 0 && salesChartSize.height > 0 && (
                  <LineChart
                    width={salesChartSize.width}
                    height={salesChartSize.height}
                    data={dailySales}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: any) =>
                        formatCurrency(Number(value || 0))
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#111827"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="mb-3">
                <p className="text-sm font-medium text-zinc-900">
                  Distribusi Status Order
                </p>
                <p className="text-xs text-zinc-500">
                  Jumlah order per status
                </p>
              </div>

              <div ref={statusChartRef} className="h-72 min-h-[288px]">
                {statusChartSize.width > 0 && statusChartSize.height > 0 && (
                  <BarChart
                    width={statusChartSize.width}
                    height={statusChartSize.height}
                    data={statusBreakdown}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#111827" radius={[8, 8, 0, 0]} />
                  </BarChart>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 lg:col-span-2">
              <div className="mb-3">
                <p className="text-sm font-medium text-zinc-900">
                  Status Inventori
                </p>
                <p className="text-xs text-zinc-500">
                  Aman, rendah, dan habis
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-[280px_1fr] md:items-center">
                <div ref={inventoryChartRef} className="h-72 min-h-[288px]">
                  {inventoryChartSize.width > 0 &&
                    inventoryChartSize.height > 0 && (
                      <PieChart
                        width={inventoryChartSize.width}
                        height={inventoryChartSize.height}
                      >
                        <Pie
                          data={inventoryBreakdown}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={4}
                        >
                          {inventoryBreakdown.map((entry, index) => (
                            <Cell
                              key={`cell-${entry.name}-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    )}
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
                    <span className="font-medium text-zinc-900">Aman:</span>{" "}
                    produk dengan stok di atas minimum.
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
                    <span className="font-medium text-zinc-900">Rendah:</span>{" "}
                    stok masih ada tetapi sudah menyentuh minimum.
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
                    <span className="font-medium text-zinc-900">Habis:</span>{" "}
                    stok bernilai 0.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-zinc-600" />
            <h2 className="text-lg font-semibold text-zinc-900">
              Top Low Stock
            </h2>
          </div>

          <div className="mb-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            Total produk: {totalProducts}
          </div>

          <div className="space-y-3">
            {topProducts.length > 0 ? (
              topProducts.map((item) => (
                <div
                  key={item.productId}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3"
                >
                  <div className="font-medium text-zinc-900">
                    {item.productName || "-"}
                  </div>
                  <div className="text-sm text-zinc-500">
                    SKU: {item.sku || "-"}
                  </div>
                  <div className="mt-2 text-sm text-zinc-700">
                    Stok: {Number(item.stock || 0)} / Min:{" "}
                    {Number(item.minStockLevel || 0)}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm text-zinc-500">
                Belum ada data inventori.
              </div>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            <span className="font-medium text-zinc-900">Stok kosong:</span>{" "}
            {emptyStockCount}
          </div>
        </div>
      </div>
    )}
    
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Clock3 className="h-5 w-5 text-zinc-600" />
          <h2 className="text-lg font-semibold text-zinc-900">
            Recent Orders
          </h2>
        </div>

        <div className="space-y-3">
          {recentOrders.length > 0 ? (
            recentOrders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                compact
                onDetail={openDetail}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm text-zinc-500">
              Belum ada pesanan.
            </div>
          )}
        </div>
      </div>

      {isDetailOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900">
                  Detail Order
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {selectedOrder.orderNumber}
                </p>
              </div>

              <button
                onClick={closeDetail}
                className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isLoadingDetail ? (
              <div className="py-16 text-center text-zinc-500">
                Memuat detail...
              </div>
            ) : (
              <>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-sm text-zinc-500">Order Number</p>
                    <p className="mt-1 font-medium text-zinc-900">
                      {selectedOrder.orderNumber || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-sm text-zinc-500">Status</p>
                    <p className="mt-1 font-medium text-zinc-900">
                      {selectedOrder.status || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-sm text-zinc-500">Total Amount</p>
                    <p className="mt-1 font-medium text-zinc-900">
                      {formatCurrency(selectedOrder.totalAmount)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-sm text-zinc-500">Shipping Cost</p>
                    <p className="mt-1 font-medium text-zinc-900">
                      {formatCurrency(selectedOrder.shippingCost)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 md:col-span-2">
                    <p className="text-sm text-zinc-500">Tanggal Order</p>
                    <p className="mt-1 font-medium text-zinc-900">
                      {formatDate(selectedOrder.orderDate || selectedOrder.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-700">
                      Item Order
                    </p>

                    <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white">
                      {selectedOrder.items?.length || 0} item
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {selectedOrder.items?.length ? (
                      selectedOrder.items.map((item, index) => (
                        <div
                          key={`${item.id || item.productId}-${index}`}
                          className="rounded-2xl border border-zinc-200 bg-white p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="font-medium text-zinc-900">
                                {item.productName || "-"}
                              </div>
                              <div className="mt-1 text-sm text-zinc-500">
                                SKU: {item.sku || "-"}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-sm text-zinc-500">Qty</div>
                              <div className="font-medium text-zinc-900">
                                {item.quantity || 0}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 text-sm">
                            <span className="text-zinc-500">Harga</span>
                            <span className="font-medium text-zinc-900">
                              {formatCurrency(item.price)}
                            </span>
                          </div>

                          <div className="mt-2 flex items-center justify-between text-sm">
                            <span className="text-zinc-500">Subtotal</span>
                            <span className="font-semibold text-zinc-900">
                              {formatCurrency(
                                item.lineTotal ||
                                  Number(item.price || 0) *
                                    Number(item.quantity || 0)
                              )}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500">
                        Tidak ada item order.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}