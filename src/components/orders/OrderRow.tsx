import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  Package,
  RefreshCcw,
  Truck,
  XCircle,
} from "lucide-react";

export type OrderRowData = {
  id: string;
  orderNumber?: string;
  marketplaceOrderId?: string;
  status?: string;
  totalAmount?: number;
  shippingCost?: number;
  orderDate?: string;
  createdAt?: string;
  itemsCount?: number;
};

function formatCurrency(value?: number) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusMeta(status?: string) {
  const value = String(status || "").toUpperCase();

  switch (value) {
    case "PENDING":
      return {
        label: "Pending",
        icon: Clock3,
        className: "border-amber-200 bg-amber-50 text-amber-700",
      };
    case "PAID":
      return {
        label: "Paid",
        icon: CheckCircle2,
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case "SHIPPED":
      return {
        label: "Shipped",
        icon: Truck,
        className: "border-blue-200 bg-blue-50 text-blue-700",
      };
    case "DELIVERED":
      return {
        label: "Delivered",
        icon: Package,
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        icon: XCircle,
        className: "border-red-200 bg-red-50 text-red-700",
      };
    case "REFUNDED":
      return {
        label: "Refunded",
        icon: RefreshCcw,
        className: "border-zinc-300 bg-zinc-100 text-zinc-700",
      };
    default:
      return {
        label: value || "-",
        icon: AlertTriangle,
        className: "border-zinc-300 bg-zinc-100 text-zinc-700",
      };
  }
}

export function OrderRow({
  order,
  onDetail,
  compact = false,
}: {
  order: OrderRowData;
  onDetail?: (order: OrderRowData) => void;
  compact?: boolean;
}) {
  const status = getStatusMeta(order.status);
  const StatusIcon = status.icon;

  if (compact) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium text-zinc-900">
              {order.orderNumber || "-"}
            </p>
            <p className="truncate text-sm text-zinc-500">
              {order.marketplaceOrderId || "-"}
            </p>
            <p className="text-sm text-zinc-400">
              {formatDate(order.orderDate || order.createdAt)}
            </p>
          </div>

          <div className="text-right">
            <p className="font-medium text-zinc-900">
              {formatCurrency(order.totalAmount)}
            </p>
            <p className="text-sm text-zinc-500">
              + {formatCurrency(order.shippingCost)} ongkir
            </p>
            <p className="text-xs text-zinc-500">{status.label}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${status.className}`}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {status.label}
          </span>

          <button
            onClick={() => onDetail?.(order)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-white"
          >
            <Eye className="h-3.5 w-3.5" />
            Detail
          </button>
        </div>
      </div>
    );
  }

  return (
    <tr className="transition hover:bg-zinc-50">
      <td className="px-4 py-4">
        <div className="font-medium text-zinc-900">
          {order.orderNumber || "-"}
        </div>
        <div className="mt-1 text-sm text-zinc-500">
          {order.marketplaceOrderId || order.id}
        </div>
      </td>

      <td className="px-4 py-4">
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${status.className}`}
        >
          <StatusIcon className="h-3.5 w-3.5" />
          {status.label}
        </span>
      </td>

      <td className="px-4 py-4 text-sm font-medium text-zinc-900">
        {formatCurrency(order.totalAmount)}
      </td>

      <td className="px-4 py-4 text-sm text-zinc-600">
        {formatDate(order.orderDate || order.createdAt)}
      </td>

      <td className="px-4 py-4 text-right">
        <button
          onClick={() => onDetail?.(order)}
          className="inline-flex items-center gap-2 rounded-2xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          <Eye className="h-4 w-4" />
          Detail
        </button>
      </td>
    </tr>
  );
}