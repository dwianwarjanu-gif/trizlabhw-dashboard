import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Bell,
  Package,
  ShoppingCart,
  Store,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

import {
  productsApi,
  ordersApi,
  marketplacesApi,
  inventoryApi,
} from "@/services/api";

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [products, orders, marketplaces, lowStock] =
        await Promise.all([
          productsApi.getAll(),
          ordersApi.getAll(),
          marketplacesApi.getUserAccounts(),
          inventoryApi.getLowStock(),
        ]);

      return {
        products: products.data || [],
        orders: orders.data || [],
        marketplaces: marketplaces.data || [],
        lowStock: lowStock.data || [],
      };
    },
  });

  const stats = [
    {
      label: "Total Produk",
      value: data?.products?.length || 0,
      note: "Produk terdaftar",
      icon: Package,
    },
    {
      label: "Total Pesanan",
      value: data?.orders?.length || 0,
      note: "Pesanan masuk",
      icon: ShoppingCart,
    },
    {
      label: "Marketplace Terhubung",
      value: data?.marketplaces?.length || 0,
      note: "Marketplace aktif",
      icon: Store,
    },
    {
      label: "Stok Rendah",
      value: data?.lowStock?.length || 0,
      note: "Produk perlu restock",
      icon: AlertTriangle,
    },
  ];

  if (isLoading) {
    return (
      <div className="p-10 text-center text-zinc-500">
        Memuat dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-zinc-500">
          <Bell className="h-5 w-5" />
          <span className="text-sm font-medium">
            Dashboard Overview
          </span>
        </div>

        <div className="mt-4">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Dashboard
          </h1>

          <p className="mt-2 max-w-2xl text-zinc-600">
            Ringkasan performa toko, status pesanan,
            dan kondisi operasional terbaru.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-zinc-500">
                    {item.label}
                  </p>

                  <p className="mt-2 text-3xl font-semibold text-zinc-900">
                    {item.value}
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-zinc-700">
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <p className="mt-4 text-sm text-zinc-500">
                {item.note}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-zinc-600" />

            <h2 className="text-lg font-semibold text-zinc-900">
              Aktivitas Terbaru
            </h2>
          </div>

          <div className="space-y-3">
            {data?.orders?.slice(0, 5).map((order: any) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-zinc-900">
                    {order.orderNumber || order.id}
                  </p>

                  <p className="text-sm text-zinc-500">
                    {order.customerName || "Customer"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-medium text-zinc-900">
                    Rp{" "}
                    {Number(order.total || 0).toLocaleString(
                      "id-ID"
                    )}
                  </p>

                  <p className="text-sm text-zinc-500">
                    {order.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-zinc-600" />

            <h2 className="text-lg font-semibold text-zinc-900">
              Status Cepat
            </h2>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
              API backend aktif dan terhubung.
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
              Marketplace aktif:
              {" "}
              {data?.marketplaces?.length || 0}
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
              Produk aktif:
              {" "}
              {data?.products?.length || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}