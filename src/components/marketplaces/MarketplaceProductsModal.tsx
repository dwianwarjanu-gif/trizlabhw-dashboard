import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

import { marketplacesApi } from "@/services/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { cn } from "@/utils/cn";

type Props = {
  account: any;
  onClose: () => void;
};

function unwrap(value: any) {
  return value?.data ?? value;
}

const MarketplaceProductsModal: React.FC<Props> = ({ account, onClose }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["marketplace-products", account?.id],
    queryFn: () => marketplacesApi.getAccountProducts(account.id, { page: 1, limit: 50 }),
    enabled: Boolean(account?.id),
    refetchOnMount: "always",
    staleTime: 0,
  });

  const response = unwrap(data);
  const products = response?.products || [];
  const pagination = response?.pagination;

  const getStatusBadge = (status?: string) => {
    const normalized = String(status || "PENDING").toUpperCase();

    if (normalized === "SUCCESS") {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
          <CheckCircleIcon className="mr-1 h-3 w-3" />
          SUCCESS
        </span>
      );
    }

    if (normalized === "FAILED") {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
          <XCircleIcon className="mr-1 h-3 w-3" />
          FAILED
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
        <ClockIcon className="mr-1 h-3 w-3" />
        {normalized}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="fixed inset-0 bg-black/40" onClick={onClose} />

        <div className="relative z-10 w-full max-w-5xl rounded-2xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Produk Marketplace
              </h2>
              <p className="text-sm text-gray-500">
                {account?.marketplace?.name} • {account?.storeName}
              </p>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <LoadingSpinner size="md" text="Memuat produk marketplace..." />
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
                <p className="text-sm font-medium text-gray-900">
                  Belum ada produk tersinkron
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Jalankan Sync Produk untuk membuat mapping produk marketplace.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Produk
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        SKU
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Marketplace Product ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Last Synced
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white">
                    {products.map((item: any) => {
                      const productName =
                        item.variant?.variantName || item.product?.name || "-";
                      const sku = item.variant?.sku || item.product?.sku || "-";

                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {productName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {sku}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.marketplaceProductId}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {getStatusBadge(item.syncStatus)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.lastSynced
                              ? new Date(item.lastSynced).toLocaleString("id-ID")
                              : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {pagination && (
              <div className="mt-4 text-sm text-gray-500">
                Total produk: {pagination.total || 0}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceProductsModal;