import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/services/api";
import {
  ArrowLeft,
  Package,
  User,
  Calendar,
  CreditCard,
  Loader2,
  RefreshCcw,
  CheckCircle2,
} from "lucide-react";

type MaybeString = string | null | undefined;
type MaybeNumber = number | string | null | undefined;

interface OrderItem {
  id: MaybeNumber;
  product_name?: MaybeString;
  productName?: MaybeString;
  sku?: MaybeString;
  qty?: MaybeNumber;
  quantity?: MaybeNumber;
  price?: MaybeNumber;
  subtotal?: MaybeNumber;
}

interface OrderDetail {
  id: MaybeNumber;
  invoice_number?: MaybeString;
  order_number?: MaybeString;
  marketplaceOrderId?: MaybeString;
  marketplace_order_id?: MaybeString;

  customer_name?: MaybeString;
  customerName?: MaybeString;
  customer_email?: MaybeString;
  customerEmail?: MaybeString;
  customer_phone?: MaybeString;
  customerPhone?: MaybeString;

  status?: MaybeString;
  payment_status?: MaybeString;
  paymentStatus?: MaybeString;

  grand_total?: MaybeNumber;
  total_amount?: MaybeNumber;
  totalAmount?: MaybeNumber;
  shippingCost?: MaybeNumber;
  shipping_cost?: MaybeNumber;
  shipping_costs?: MaybeNumber;

  created_at?: MaybeString;
  createdAt?: MaybeString;
  updated_at?: MaybeString;
  updatedAt?: MaybeString;

  items?: OrderItem[];
}

const STATUS_OPTIONS = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

function toNumber(value: MaybeNumber, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toStringValue(value: MaybeString, fallback = "-") {
  const s = String(value ?? "").trim();
  return s.length ? s : fallback;
}

function formatCurrency(value: MaybeNumber) {
  return `Rp ${toNumber(value).toLocaleString("id-ID")}`;
}

function formatDate(value?: MaybeString) {
  if (!value) return "-";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeOrderItem(item: OrderItem) {
  const qty = toNumber(item.qty ?? item.quantity, 0);
  const price = toNumber(item.price, 0);
  const subtotal = toNumber(item.subtotal, qty * price);

  return {
    id: item.id ?? `${item.product_name ?? item.productName ?? "item"}-${Math.random()}`,
    productName: item.product_name ?? item.productName ?? "-",
    sku: item.sku ?? "-",
    qty,
    price,
    subtotal,
  };
}

function normalizeOrder(raw: any): OrderDetail | null {
  if (!raw || typeof raw !== "object") return null;

  const items = Array.isArray(raw.items) ? raw.items.map(normalizeOrderItem) : [];

  return {
    id: raw.id,
    invoice_number: raw.invoice_number ?? raw.orderNumber ?? raw.order_number,
    order_number: raw.order_number ?? raw.orderNumber ?? raw.invoice_number,
    marketplaceOrderId:
      raw.marketplaceOrderId ?? raw.marketplace_order_id ?? raw.externalOrderId ?? raw.external_order_id,
    customer_name: raw.customer_name ?? raw.customerName ?? raw.buyerName ?? raw.buyer_name,
    customer_email: raw.customer_email ?? raw.customerEmail ?? "",
    customer_phone: raw.customer_phone ?? raw.customerPhone ?? "",
    status: raw.status ?? "PENDING",
    payment_status: raw.payment_status ?? raw.paymentStatus ?? "UNPAID",
    grand_total: raw.grand_total ?? raw.grandTotal,
    total_amount: raw.total_amount ?? raw.totalAmount,
    shippingCost: raw.shippingCost ?? raw.shipping_cost ?? raw.shipping_costs,
    created_at: raw.created_at ?? raw.createdAt ?? raw.orderDate ?? raw.order_date,
    updated_at: raw.updated_at ?? raw.updatedAt,
    items,
  };
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [statusDraft, setStatusDraft] = useState("PENDING");

  const fetchOrder = async () => {
    if (!id) {
      setError("Order ID tidak ditemukan");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await api.get(`/orders/${id}`);

      const raw =
        res?.data?.order ||
        res?.data?.data ||
        res?.data;

      const normalized = normalizeOrder(raw);

      if (!normalized) {
        throw new Error("Order tidak ditemukan");
      }

      setOrder(normalized);
      setStatusDraft(String(normalized.status || "PENDING").toUpperCase());
    } catch (err: any) {
      console.error("GET ORDER DETAIL ERROR:", err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Gagal memuat detail order"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const total = useMemo(() => {
    if (!order) return 0;

    if (order.grand_total !== undefined && order.grand_total !== null) {
      return toNumber(order.grand_total);
    }

    if (order.total_amount !== undefined && order.total_amount !== null) {
      return toNumber(order.total_amount);
    }

    return (order.items || []).reduce((acc, item) => acc + toNumber(item.subtotal, 0), 0);
  }, [order]);

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      if (!id) throw new Error("Order ID tidak ditemukan");
      return api.patch(`/orders/${id}/status`, { status });
    },
    onSuccess: async (res) => {
      const raw = res?.data?.order || res?.data?.data || res?.data;
      const normalized = normalizeOrder(raw);

      if (normalized) {
        setOrder(normalized);
        setStatusDraft(String(normalized.status || statusDraft).toUpperCase());
      }

      toast.success("Status order berhasil diperbarui");
      await fetchOrder();
    },
    onError: (err: any) => {
      console.error("UPDATE STATUS ERROR:", err);
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Gagal memperbarui status"
      );
    },
    onSettled: () => {
      setSaving(false);
    },
  });

  const handleSaveStatus = async () => {
    if (!statusDraft) return;
    setSaving(true);
    updateStatusMutation.mutate(statusDraft);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading order detail...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="font-semibold text-red-700">Gagal memuat order</div>
          <div className="mt-1 text-sm text-red-600">{error}</div>
          <button
            onClick={fetchOrder}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
          Order tidak ditemukan
        </div>
      </div>
    );
  }

  const shippingCost = toNumber(order.shippingCost, 0);

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/orders")}
            className="rounded-2xl border border-zinc-300 p-2 transition hover:bg-zinc-100"
            aria-label="Kembali"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Detail Order</h1>
            <p className="text-sm text-zinc-500">
              {toStringValue(order.invoice_number || order.order_number || `ORDER-${order.id}`)}
            </p>
          </div>
        </div>

        <button
          onClick={fetchOrder}
          className="inline-flex items-center gap-2 rounded-2xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* INFO */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <User size={18} />
            <span className="font-semibold">Customer</span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="font-medium text-zinc-900">
              {toStringValue(order.customer_name, "-")}
            </div>
            <div className="text-zinc-500">{toStringValue(order.customer_email, "-")}</div>
            <div className="text-zinc-500">{toStringValue(order.customer_phone, "-")}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Package size={18} />
            <span className="font-semibold">Status</span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500">Order</span>
              <span className="font-medium text-zinc-900">{toStringValue(order.status, "-")}</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500">Payment</span>
              <span className="font-medium text-zinc-900">
                {toStringValue(order.payment_status, "-")}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Calendar size={18} />
            <span className="font-semibold">Tanggal</span>
          </div>

          <div className="text-sm text-zinc-700">
            {formatDate(order.created_at)}
          </div>
        </div>
      </div>

      {/* UPDATE STATUS */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Update Status</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Perubahan status akan dikirim ke endpoint <code>/api/orders/:id/status</code>.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">
          <select
            value={statusDraft}
            onChange={(e) => setStatusDraft(e.target.value)}
            className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-900"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <button
            onClick={handleSaveStatus}
            disabled={saving || updateStatusMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving || updateStatusMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Simpan
          </button>
        </div>
      </div>

      {/* ITEMS */}
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 p-4">
          <h2 className="font-semibold text-zinc-900">Item Order</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Produk</th>
                <th className="px-4 py-3 text-left font-medium">SKU</th>
                <th className="px-4 py-3 text-right font-medium">Qty</th>
                <th className="px-4 py-3 text-right font-medium">Harga</th>
                <th className="px-4 py-3 text-right font-medium">Subtotal</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 bg-white">
              {order.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-zinc-500">
                    Item order kosong.
                  </td>
                </tr>
              ) : (
                order.items.map((item, index) => (
                  <tr key={String(item.id ?? index)} className="hover:bg-zinc-50">
                    <td className="px-4 py-4 font-medium text-zinc-900">
                      {toStringValue(item.productName, "-")}
                    </td>
                    <td className="px-4 py-4 text-zinc-700">
                      {toStringValue(item.sku, "-")}
                    </td>
                    <td className="px-4 py-4 text-right text-zinc-700">
                      {toNumber(item.qty, 0)}
                    </td>
                    <td className="px-4 py-4 text-right text-zinc-700">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-zinc-900">
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TOTAL */}
      <div className="flex justify-end">
        <div className="w-full rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:w-[380px]">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard size={18} />
            <span className="font-semibold text-zinc-900">Ringkasan Pembayaran</span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Subtotal Item</span>
              <span className="font-medium text-zinc-900">{formatCurrency(total)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Shipping Cost</span>
              <span className="font-medium text-zinc-900">{formatCurrency(shippingCost)}</span>
            </div>

            <div className="h-px bg-zinc-200" />

            <div className="flex items-center justify-between text-lg font-bold text-zinc-900">
              <span>Total</span>
              <span>{formatCurrency(total + shippingCost)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}