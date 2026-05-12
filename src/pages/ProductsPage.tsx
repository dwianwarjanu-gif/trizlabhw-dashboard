import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { PackageSearch } from 'lucide-react'
import api from '@/services/api'

type Product = {
  id: string
  name: string
  sku: string
  price: number
  stock?: number
  isActive?: boolean
}

const ProductsPage: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products')
      return res.data as Product[]
    },
  })

  const products = data ?? []

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Produk</h1>
        <p className="mt-2 max-w-2xl text-zinc-600">
          Kelola katalog produk, harga, stok, dan status aktif toko Anda.
        </p>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full flex-col gap-3 md:flex-row">
            <input
              type="text"
              placeholder="Cari produk, SKU, atau nama..."
              className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-900"
            />

            <select className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-900 md:w-56">
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>

          <button className="rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800">
            + Tambah Produk
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        {isLoading ? (
          <div className="py-16 text-center text-zinc-500">Memuat produk...</div>
        ) : error ? (
          <div className="py-16 text-center text-red-600">
            Gagal memuat data produk.
          </div>
        ) : products.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">Nama</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">SKU</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">Harga</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 text-sm font-medium text-zinc-900">
                      {product.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600">{product.sku}</td>
                    <td className="px-4 py-3 text-sm text-zinc-600">
                      Rp {Number(product.price || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600">
                      {product.stock ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-2xl text-zinc-500">
              <PackageSearch className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-zinc-900">Belum ada produk</h2>
            <p className="mt-2 max-w-md text-sm text-zinc-500">
              Produk pertama akan muncul di sini setelah Anda menambahkan katalog baru.
            </p>
            <button className="mt-6 rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800">
              + Tambah Produk
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductsPage