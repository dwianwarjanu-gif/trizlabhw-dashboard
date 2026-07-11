import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  Loader2,
  PackagePlus,
  PencilLine,
  RefreshCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import Can from "@/components/auth/Can";
import { productsApi } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

type Product = {
  id: string;
  name: string;
  sku: string;
  brand?: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  image_url?: string;
  images?: string[];
  productImages?: any[];
  freeShipping?: boolean;
  free_shipping?: number;
  price: number;
  stock: number;
  status?: string;
  weight?: number | null;
  lengthCm?: number | null;
  length_cm?: number | null;
  widthCm?: number | null;
  width_cm?: number | null;
  heightCm?: number | null;
  height_cm?: number | null;
  minStockLevel?: number;
  min_stock_level?: number;
  createdAt?: string;
};

type ProductForm = {
  name: string;
  sku: string;
  brand: string;
  category: string;
  description: string;
  image_url: string;
  images: string[];
  free_shipping: boolean;
  price: number;
  stock: number;
  weight: number | "";
  length_cm: number | "";
  width_cm: number | "";
  height_cm: number | "";
  minStockLevel: number;
  status: string;
};

type ProductVariant = {
  id: string;
  sku: string;
  name: string;
  imageUrl?: string | null;
  image_url?: string | null;
  price: number;
  weight?: number | null;
  stock: number;
  minStockLevel?: number;
  options?: Array<{
    name?: string;
    value?: string;
    option_name?: string;
    option_value?: string;
  }>;
};

type VariantForm = {
  sku: string;
  name: string;
  image_url: string;
  price: number;
  weight: number | "";
  stock: number;
  minStockLevel: number;
  option1Name: string;
  option1Value: string;
  option2Name: string;
  option2Value: string;
};

function extractProducts(data: any): Product[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function extractMasterData(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.categories)) return data.categories;
  if (Array.isArray(data?.brands)) return data.brands;
  return [];
}

function formatCurrency(value?: number) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

function getProductImages(product: Product): string[] {
  const fromImages = Array.isArray(product.images) ? product.images : [];
  const fromProductImages = Array.isArray(product.productImages)
    ? product.productImages
        .map((item) => item?.image_url || item?.imageUrl || item?.url)
        .filter(Boolean)
    : [];

  return Array.from(
    new Set([
      product.image_url || product.imageUrl,
      ...fromImages,
      ...fromProductImages,
    ].filter(Boolean) as string[])
  );
}

const EMPTY_FORM: ProductForm = {
  name: "",
  sku: "",
  brand: "",
  category: "",
  description: "",
  image_url: "",
  images: [],
  free_shipping: false,
  price: 0,
  stock: 0,
  weight: "",
  length_cm: "",
  width_cm: "",
  height_cm: "",
  minStockLevel: 0,
  status: "ACTIVE",
};

const EMPTY_VARIANT_FORM: VariantForm = {
  sku: "",
  name: "",
  image_url: "",
  price: 0,
  weight: "",
  stock: 0,
  minStockLevel: 0,
  option1Name: "Warna",
  option1Value: "",
  option2Name: "Kondisi",
  option2Value: "",
};

const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  ADMIN: ["*"],
  STAFF: [
    "products.view",
    "products.create",
    "products.update",
    "orders.view",
    "orders.detail",
    "orders.update",
    "marketplaces.view",
  ],
};

export default function ProductsPage() {
  const queryClient = useQueryClient();
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

  const canCreateProduct =
    isAdmin ||
    effectivePermissions.includes("*") ||
    effectivePermissions.includes("products.create");

  const canEditProduct =
    isAdmin ||
    effectivePermissions.includes("*") ||
    effectivePermissions.includes("products.update") ||
    effectivePermissions.includes("products.edit");

  const canDeleteProduct =
    isAdmin ||
    effectivePermissions.includes("*") ||
    effectivePermissions.includes("products.delete");

  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [detail, setDetail] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeImage, setActiveImage] = useState<string>("");
  const [isVariantFormOpen, setIsVariantFormOpen] = useState(false);
  const [variantForm, setVariantForm] = useState<VariantForm>(EMPTY_VARIANT_FORM);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await productsApi.getAll();
      return extractProducts(res.data);
    },
  });

  const { data: categoriesData } = useQuery({
  queryKey: ["product-categories"],
  queryFn: async () => {
    const res = await productsApi.getCategories();
    return extractMasterData(res.data);
  },
});

const { data: brandsData } = useQuery({
  queryKey: ["product-brands"],
  queryFn: async () => {
    const res = await productsApi.getBrands();
    return extractMasterData(res.data);
  },
});

const categories = categoriesData || [];
const brands = brandsData || [];

const { data: variantsData, isLoading: variantsLoading } = useQuery({
  queryKey: ["product-variants", detail?.id],
  queryFn: async () => {
    if (!detail?.id) return [];
    const res = await productsApi.getVariants(detail.id);
    return Array.isArray(res.data?.variants) ? res.data.variants : [];
  },
  enabled: Boolean(detail?.id),
});

const variants: ProductVariant[] = variantsData || [];

  const products = data || [];

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;

    return products.filter((product) => {
      return (
        product.name?.toLowerCase().includes(q) ||
        product.sku?.toLowerCase().includes(q) ||
        product.brand?.toLowerCase().includes(q) ||
        product.category?.toLowerCase().includes(q) ||
        product.description?.toLowerCase().includes(q)
      );
    });
  }, [products, search]);

  const createMutation = useMutation({
    mutationFn: async (payload: ProductForm) => {
      return productsApi.create(payload);
    },
    onSuccess: async () => {
      toast.success("Produk berhasil dibuat");
      setIsFormOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      await queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal membuat produk");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ProductForm }) => {
      return productsApi.update(id, payload);
    },
    onSuccess: async () => {
      toast.success("Produk berhasil diupdate");
      setIsFormOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      await queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal update produk");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return productsApi.delete(id);
    },
    onSuccess: async () => {
      toast.success("Produk berhasil dihapus");
      await queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal hapus produk");
    },
  });

  const createVariantMutation = useMutation({
  mutationFn: async (payload: any) => {
    if (!detail?.id) {
      throw new Error("Product detail tidak ditemukan");
    }

    return productsApi.createVariant(detail.id, payload);
  },
  onSuccess: async () => {
    toast.success("Variant berhasil dibuat");
    setIsVariantFormOpen(false);
    setVariantForm(EMPTY_VARIANT_FORM);

    await queryClient.invalidateQueries({
      queryKey: ["product-variants", detail?.id],
    });

    await queryClient.invalidateQueries({
      queryKey: ["products"],
    });
  },
  onError: (err: any) => {
    toast.error(err?.response?.data?.message || "Gagal membuat variant");
  },
});

  const updateVariantMutation = useMutation({
    mutationFn: async ({
      variantId,
      payload,
    }: {
      variantId: string;
      payload: any;
    }) => {
      return productsApi.updateVariant(variantId, payload);
    },
    onSuccess: async () => {
      toast.success("Variant berhasil diupdate");
      setIsVariantFormOpen(false);
      setEditingVariant(null);
      setVariantForm(EMPTY_VARIANT_FORM);

      await queryClient.invalidateQueries({
        queryKey: ["product-variants", detail?.id],
      });

      await queryClient.invalidateQueries({
        queryKey: ["products"],
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal update variant");
    },
  });

const deleteVariantMutation = useMutation({
  mutationFn: async (variantId: string) => {
    return productsApi.deleteVariant(variantId);
  },
  onSuccess: async () => {
    toast.success("Variant berhasil dihapus");

    await queryClient.invalidateQueries({
      queryKey: ["product-variants", detail?.id],
    });

    await queryClient.invalidateQueries({
      queryKey: ["products"],
    });
  },
  onError: (err: any) => {
    toast.error(err?.response?.data?.message || "Gagal hapus variant");
  },
});

  const openEditVariant = (variant: ProductVariant) => {
    const option1 = variant.options?.[0];
    const option2 = variant.options?.[1];

    setEditingVariant(variant);
    setVariantForm({
      sku: variant.sku || "",
      name: variant.name || "",
      image_url: variant.image_url || variant.imageUrl || "",
      price: Number(variant.price || 0),
      weight: variant.weight ?? "",
      stock: Number(variant.stock || 0),
      minStockLevel: Number(variant.minStockLevel || 0),
      option1Name: option1?.name || option1?.option_name || "Warna",
      option1Value: option1?.value || option1?.option_value || "",
      option2Name: option2?.name || option2?.option_name || "Kondisi",
      option2Value: option2?.value || option2?.option_value || "",
    });

    setIsVariantFormOpen(true);
  };

  const openCreate = () => {
    if (!canCreateProduct) return;
    setEditing(null);
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
  };

  const openEdit = (product: Product) => {
    if (!canEditProduct) return;

    const productImages = getProductImages(product);

    setEditing(product);
    setForm({
      name: product.name || "",
      sku: product.sku || "",
      brand: product.brand || "",
      category: product.category || "",
      description: product.description || "",
      price: Number(product.price || 0),
      stock: Number(product.stock || 0),
      status: product.status || "ACTIVE",
      image_url: product.image_url || product.imageUrl || productImages[0] || "",
      images: productImages,
      free_shipping: Boolean(product.freeShipping || product.free_shipping),
      weight: product.weight ?? "",
      length_cm: product.length_cm ?? product.lengthCm ?? "",
      width_cm: product.width_cm ?? product.widthCm ?? "",
      height_cm: product.height_cm ?? product.heightCm ?? "",
      minStockLevel: Number(product.minStockLevel ?? product.min_stock_level ?? 0),
    });

    setIsFormOpen(true);
  };

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    try {
      setUploadingImage(true);

      const uploadedUrls: string[] = [];

      for (const file of files) {
        const uploadForm = new FormData();
        uploadForm.append("image", file);

        const res = await productsApi.uploadImage(uploadForm);
        const imageUrl = res.data?.imageUrl || res.data?.image_url;

        if (imageUrl) uploadedUrls.push(imageUrl);
      }

      if (!uploadedUrls.length) {
        toast.error("Tidak ada gambar yang berhasil diupload");
        return;
      }

      setForm((prev) => {
        const nextImages = Array.from(
          new Set([...(prev.images || []), ...uploadedUrls])
        );

        return {
          ...prev,
          images: nextImages,
          image_url: prev.image_url || nextImages[0] || "",
        };
      });

      toast.success(`${uploadedUrls.length} gambar berhasil diupload`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal upload gambar");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const removeImage = (imageUrl: string) => {
    setForm((prev) => {
      const nextImages = prev.images.filter((item) => item !== imageUrl);
      return {
        ...prev,
        images: nextImages,
        image_url:
          prev.image_url === imageUrl ? nextImages[0] || "" : prev.image_url,
      };
    });
  };

  const setPrimaryImage = (imageUrl: string) => {
    setForm((prev) => ({
      ...prev,
      image_url: imageUrl,
      images: Array.from(new Set([imageUrl, ...(prev.images || [])])),
    }));
  };

  const onSubmit = () => {
  if (!form.name || !form.sku) {
    toast.error("Nama dan SKU wajib diisi");
    return;
  }

  if (!form.brand) {
    toast.error("Brand wajib dipilih");
    return;
  }

  if (!form.category) {
    toast.error("Kategori wajib dipilih");
    return;
  }

  if (!form.weight || Number(form.weight) <= 0) {
    toast.error("Berat produk wajib diisi");
    return;
  }

  if (!form.images.length) {
    toast.error("Minimal 1 gambar produk");
    return;
  }

  const payload: ProductForm = {
    ...form,
    images: Array.from(
      new Set([form.image_url, ...(form.images || [])].filter(Boolean))
    ),
  };

  if (editing) {
    if (!canEditProduct) {
      toast.error("Anda tidak punya akses untuk update produk");
      return;
    }

    updateMutation.mutate({ id: editing.id, payload });
    return;
  }

  if (!canCreateProduct) {
    toast.error("Anda tidak punya akses untuk membuat produk");
    return;
  }

  createMutation.mutate(payload);
};

  const showActions = canEditProduct || canDeleteProduct;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              Product
            </h1>
            <p className="mt-2 text-zinc-600">
              Kelola katalog Product, harga, stok, gambar, berat, dimensi, dan status aktif toko Anda.
            </p>
          </div>

          <div className="flex items-center gap-3">
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

            {canCreateProduct && (
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800"
              >
                <PackagePlus className="h-4 w-4" />
                Tambah Product
              </button>
            )}
          </div>
        </div>

        <div className="relative mt-6">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari Product, SKU, brand, kategori, atau deskripsi..."
            className="w-full rounded-2xl border border-zinc-300 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-zinc-900"
          />
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        {isLoading ? (
          <div className="py-20 text-center text-zinc-500">Memuat produk...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center text-zinc-500">
            Belum ada produk.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-200">
            <table className="min-w-[1000px] divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">
                    Nama
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">
                    Brand/Kategori
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">
                    Harga
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">
                    Stok
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100 bg-white">
                {filteredProducts.map((product) => {
                  const productImages = getProductImages(product);

                  return (
                    <tr key={product.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {productImages[0] && (
                            <img
                              src={productImages[0]}
                              alt={product.name}
                              className="h-14 w-14 rounded-xl border border-zinc-200 object-cover"
                            />
                          )}

                          <div>
                            <div className="font-medium text-zinc-900">
                              {product.name}
                            </div>
                            <div className="mt-1 line-clamp-1 text-sm text-zinc-500">
                              {product.description || "-"}
                            </div>
                            {product.freeShipping || product.free_shipping ? (
                              <span className="mt-2 inline-flex rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                                Gratis Ongkir
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-zinc-700">
                        {product.sku}
                      </td>

                      <td className="px-4 py-4 text-sm text-zinc-700">
                        <div>{product.brand || "-"}</div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {product.category || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm font-medium text-zinc-900">
                        {formatCurrency(product.price)}
                      </td>

                      <td className="px-4 py-4 text-sm text-zinc-700">
                        {Number(product.stock || 0)}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              setDetail(product);
                              const images = getProductImages(product);
                              setActiveImage(product.image_url || product.imageUrl || images[0] || "");
                            }}
                            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                          >
                            <Eye className="h-4 w-4" />
                            Detail
                          </button>

                          {canEditProduct && (
                            <button
                              onClick={() => openEdit(product)}
                              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                            >
                              <PencilLine className="h-4 w-4" />
                              Edit
                            </button>
                          )}

                          {canDeleteProduct && (
                            <button
                              onClick={() => {
                                const ok = window.confirm(
                                  `Hapus produk "${product.name}"?`
                                );
                                if (!ok) return;
                                deleteMutation.mutate(product.id);
                              }}
                              className="inline-flex items-center gap-2 rounded-2xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Hapus
                            </button>
                          )}

                          {!showActions && (
                            <span className="text-sm text-zinc-400">
                              Tidak ada aksi tambahan
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900">
                {editing ? "Edit Product" : "Tambah Product"}
              </h3>
              <button onClick={() => setIsFormOpen(false)}>
                <X className="h-5 w-5 text-zinc-500" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Nama produk"
                className="rounded-2xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
              />

              <input
                value={form.sku}
                onChange={(e) =>
                  setForm((p) => ({ ...p, sku: e.target.value }))
                }
                placeholder="SKU"
                className="rounded-2xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
              />

              <select
                 value={form.brand}
                 onChange={(e) =>
                   setForm((p) => ({ ...p, brand: e.target.value }))
                 }
                 className="rounded-2xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
              >
                 <option value="">-- Pilih Brand --</option>
                 {brands.map((brand: any) => (
                   <option key={brand.id || brand.slug || brand.name} value={brand.name}>
                     {brand.name}
                 </option>
               ))}
              </select>

              <select
                value={form.category}
                onChange={(e) =>
                  setForm((p) => ({ ...p, category: e.target.value }))
                }
                className="rounded-2xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
              >
                <option value="">-- Pilih Kategori --</option>
                {categories.map((category: any) => (
                  <option
                    key={category.id || category.slug || category.name}
                    value={category.name}
                >
                   {category.name}
                </option>
              ))}
             </select>

              <input
                type="number"
                value={form.price}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    price: Number(e.target.value),
                  }))
                }
                placeholder="Harga"
                className="rounded-2xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
              />

              <input
                type="number"
                value={form.stock}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    stock: Number(e.target.value),
                  }))
                }
                placeholder="Stok"
                className="rounded-2xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
              />

              <input
                type="number"
                value={form.weight}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    weight: e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
                placeholder="Berat gram, contoh: 500"
                className="rounded-2xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
              />

              <label className="flex items-center gap-3 rounded-2xl border border-zinc-300 px-4 py-3 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={form.free_shipping}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      free_shipping: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
                Gratis Ongkir
              </label>

              <input
                type="number"
                value={form.length_cm}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    length_cm: e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
                placeholder="Panjang cm"
                className="rounded-2xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
              />

              <input
                type="number"
                value={form.width_cm}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    width_cm: e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
                placeholder="Lebar cm"
                className="rounded-2xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
              />

              <input
                type="number"
                value={form.height_cm}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    height_cm: e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
                placeholder="Tinggi cm"
                className="rounded-2xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
              />

              <input
                type="number"
                value={form.minStockLevel}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    minStockLevel: Number(e.target.value),
                  }))
                }
                placeholder="Minimum stok"
                className="rounded-2xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
              />

              <select
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value }))
                }
                className="rounded-2xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="DRAFT">DRAFT</option>
              </select>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Gambar Product
                </label>

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImagesUpload}
                  className="w-full rounded-2xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
                />

                {uploadingImage && (
                  <p className="mt-2 text-sm text-blue-600">
                    Mengupload gambar...
                  </p>
                )}

                {form.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {form.images.map((imageUrl) => {
                      const isPrimary = form.image_url === imageUrl;

                      return (
                        <div
                          key={imageUrl}
                          className="relative rounded-2xl border border-zinc-200 bg-zinc-50 p-2"
                        >
                          <img
                            src={imageUrl}
                            alt="Preview produk"
                            className="h-28 w-full rounded-xl object-cover"
                          />

                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(imageUrl)}
                              className={`flex-1 rounded-xl px-2 py-1 text-xs font-medium ${
                                isPrimary
                                  ? "bg-green-100 text-green-700"
                                  : "bg-white text-zinc-700 hover:bg-zinc-100"
                              }`}
                            >
                              {isPrimary ? "Utama" : "Jadikan Utama"}
                            </button>

                            <button
                              type="button"
                              onClick={() => removeImage(imageUrl)}
                              className="rounded-xl bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    description: e.target.value,
                  }))
                }
                placeholder="Deskripsi"
                className="min-h-28 rounded-2xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900 md:col-span-2"
              />
            </div>

            <div className="sticky bottom-0 -mx-6 mt-6 flex justify-end gap-3 border-t bg-white px-6 py-4">
              <button
                onClick={() => setIsFormOpen(false)}
                className="rounded-2xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Batal
              </button>

              {editing ? (
                <Can permission="products.update">
                  <button
                    onClick={onSubmit}
                    disabled={updateMutation.isPending || uploadingImage}
                    className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                  >
                    {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </Can>
              ) : (
                <Can permission="products.create">
                  <button
                    onClick={onSubmit}
                    disabled={createMutation.isPending || uploadingImage}
                    className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                  >
                    {createMutation.isPending ? "Menyimpan..." : "Simpan"}
                  </button>
                </Can>
              )}
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900">Detail Product</h3>
              <button onClick={() => setDetail(null)}>
                <X className="h-5 w-5 text-zinc-500" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {getProductImages(detail).length > 0 ? (
                <div className="grid gap-3">
                  <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50">
                    <img
                      src={activeImage}
                      alt={detail.name}
                      className="max-h-72 w-full object-contain"
                    />
                  </div>

                  <div className="flex gap-2 overflow-x-auto">
                    {getProductImages(detail).map((imageUrl) => (
                      <img
                        key={imageUrl}
                        src={imageUrl}
                        alt={detail.name}
                        onClick={() => setActiveImage(imageUrl)}
                        className={`h-16 w-16 cursor-pointer rounded-xl object-cover border-2 transition
                          ${
                           activeImage === imageUrl
                             ? "border-blue-500"
                             : "border-zinc-200"
                         }`}
                     />
                ))}
          </div>                   
      {isVariantFormOpen && detail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-zinc-900">
                  {editingVariant ? "Edit Variant" : "Tambah Variant"}
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Produk: {detail.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {setIsVariantFormOpen(false);
                               setEditingVariant(null);
                               setVariantForm(EMPTY_VARIANT_FORM);

                }}
              >
                <X className="h-5 w-5 text-zinc-500" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input
                value={variantForm.name}
                onChange={(e) =>
                  setVariantForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Nama variant, contoh: Red Mint"
                className="rounded-2xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
              />

              <input
                value={variantForm.sku}
                onChange={(e) =>
                  setVariantForm((p) => ({ ...p, sku: e.target.value }))
                }
                placeholder="SKU variant, contoh: SKU-018-RED-MINT"
                className="rounded-2xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
              />

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Gambar Variant
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    try {
                      setUploadingImage(true);

                      const formData = new FormData();
                      formData.append("image", file);

                      const res = await productsApi.uploadImage(formData);
                      const imageUrl =
                        res.data?.imageUrl ||
                        res.data?.image_url ||
                        res.data?.url ||
                        "";

                      if (!imageUrl) {
                        toast.error("Upload gambar variant gagal");
                        return;
                      }

                      setVariantForm((p) => ({
                       ...p,
                       image_url: imageUrl,
                     }));

                      toast.success("Gambar variant berhasil diupload");
                    } catch (err: any) {
                      toast.error(
                        err?.response?.data?.message || "Gagal upload gambar variant"
                      );
                    } finally {
                      setUploadingImage(false);
                    }
                  }}
                  className="w-full rounded-2xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
                />

                {uploadingImage && (
                  <div className="mt-2 text-sm text-zinc-500">
                    Mengupload gambar variant...
                  </div>
                 )}

                 {variantForm.image_url && (
                   <div className="mt-3">
                     <img
                      src={variantForm.image_url}
                      alt="Preview variant"
                      className="h-28 w-28 rounded-2xl border border-zinc-200 object-cover"
                    />
                  </div>
                )}
              </div>

              <input
                type="number"
                value={variantForm.price}
                onChange={(e) =>
                  setVariantForm((p) => ({
                    ...p,
                    price: Number(e.target.value),
                  }))
                }
                placeholder="Harga variant"
                className="rounded-2xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
              />

              <input
                type="number"
                value={variantForm.stock}
                onChange={(e) =>
                  setVariantForm((p) => ({
                    ...p,
                    stock: Number(e.target.value),
                  }))
                }
                placeholder="Stok variant"
                className="rounded-2xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
              />

              <input
                type="number"
                value={variantForm.weight}
                onChange={(e) =>
                  setVariantForm((p) => ({
                    ...p,
                    weight: e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
                placeholder="Berat gram"
                className="rounded-2xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
              />

              <input
                type="number"
                value={variantForm.minStockLevel}
                onChange={(e) =>
                  setVariantForm((p) => ({
                    ...p,
                    minStockLevel: Number(e.target.value),
                  }))
                }
                placeholder="Minimum stok"
                className="rounded-2xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
              />

              <input
                value={variantForm.option1Name}
                onChange={(e) =>
                  setVariantForm((p) => ({
                    ...p,
                    option1Name: e.target.value,
                  }))
                }
                placeholder="Nama opsi 1, contoh: Warna"
                className="rounded-2xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
              />

              <input
                value={variantForm.option1Value}
                onChange={(e) =>
                  setVariantForm((p) => ({
                    ...p,
                    option1Value: e.target.value,
                  }))
                }
                placeholder="Nilai opsi 1, contoh: Merah"
                className="rounded-2xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
              />

              <input
                value={variantForm.option2Name}
                onChange={(e) =>
                  setVariantForm((p) => ({
                    ...p,
                    option2Name: e.target.value,
                  }))
                }
                placeholder="Nama opsi 2, contoh: Kondisi"
                className="rounded-2xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
              />

              <input
                value={variantForm.option2Value}
                onChange={(e) =>
                  setVariantForm((p) => ({
                    ...p,
                    option2Value: e.target.value,
                  }))
                }
                placeholder="Nilai opsi 2, contoh: Mint"
                className="rounded-2xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
              />
            </div>

            <div className="sticky bottom-0 -mx-6 mt-6 flex justify-end gap-3 border-t bg-white px-6 py-4">
              <button
                type="button"
                onClick={() => {setIsVariantFormOpen(false);
                               setEditingVariant(null);
                               setVariantForm(EMPTY_VARIANT_FORM);

                }}
                className="rounded-2xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={createVariantMutation.isPending}
                onClick={() => {
                  if (!variantForm.name || !variantForm.sku) {
                    toast.error("Nama dan SKU variant wajib diisi");
                    return;
                  }

                  if (!variantForm.option1Value) {
                    toast.error("Opsi 1 wajib diisi");
                    return;
                  }

                  const options = [
                   {
                     name: variantForm.option1Name,
                     value: variantForm.option1Value,
                   },
                 ];

                 if (variantForm.option2Name && variantForm.option2Value) {
                   options.push({
                     name: variantForm.option2Name,
                     value: variantForm.option2Value,
                   });
                 }

                 const payload = {
                   sku: variantForm.sku,
                   name: variantForm.name,
                   image_url: variantForm.image_url || null,
                   imageUrl: variantForm.image_url || null,
                   price: Number(variantForm.price || 0),
                   weight: variantForm.weight === "" ? null : Number(variantForm.weight),
                   stock: Number(variantForm.stock || 0),
                   minStockLevel: Number(variantForm.minStockLevel || 0),
                   options,
                  };

                  if (editingVariant) {
                    updateVariantMutation.mutate({
                      variantId: editingVariant.id,
                      payload,
                    });
                    return;
                  }

                  createVariantMutation.mutate(payload);
                }}
                className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {createVariantMutation.isPending || updateVariantMutation.isPending
                  ? "Menyimpan..."
                  : editingVariant
                    ? "Simpan Perubahan"
                    : "Simpan Variant"}
              </button>
             </div>
           </div>
         </div>
        )}     
         </div>
              ) : (
                <div className="flex h-48 items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500">
                  Belum ada gambar produk
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ["Nama", detail.name],
                  ["SKU", detail.sku],
                  ["Brand", detail.brand || "-"],
                  ["Kategori", detail.category || "-"],
                  ["Harga", formatCurrency(detail.price)],
                  ["Stok", Number(detail.stock || 0)],
                  ["Berat", detail.weight ? `${detail.weight} gram` : "-"],
                  [
                    "Dimensi",
                    `${detail.length_cm ?? detail.lengthCm ?? "-"} x ${
                      detail.width_cm ?? detail.widthCm ?? "-"
                    } x ${detail.height_cm ?? detail.heightCm ?? "-"} cm`,
                  ],
                  [
                    "Gratis Ongkir",
                    detail.freeShipping || detail.free_shipping ? "Ya" : "Tidak",
                  ],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                  >
                    <div className="text-sm text-zinc-500">{label}</div>
                    <div className="font-medium text-zinc-900">{value}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="text-sm text-zinc-500">Deskripsi</div>
                <div className="font-medium text-zinc-900">
                  {detail.description || "-"}
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-zinc-900">Variant Produk</h4>
                    <p className="mt-1 text-sm text-zinc-500">
                      SKU turunan berdasarkan warna, kondisi, ukuran, atau opsi lain.
                    </p>
                 </div>

                 {canEditProduct && (
                   <button
                     type="button"
                     onClick={() => {
                     setEditingVariant(null);
                     setVariantForm({
                        ...EMPTY_VARIANT_FORM,
                        image_url: "",
                        price: Number(detail.price || 0),
                        weight: detail.weight ?? "",
                        stock: 0,
                        minStockLevel: 0,
                      });
                      setIsVariantFormOpen(true);
                    }}
                      className="rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                    >
                      + Tambah Variant
                   </button>
                 )}
              </div>

              <div className="mt-4">
                {variantsLoading ? (
                 <div className="py-6 text-center text-sm text-zinc-500">
                   Memuat variant...
                 </div>
               ) : variants.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm text-zinc-500">
                  Belum ada variant untuk produk ini.
                </div>
               ) : (
                 <div className="space-y-3">
                  {variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                    >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                     <div className="flex gap-3">
                       {(variant.image_url || variant.imageUrl) && (
                        <img
                          src={variant.image_url || variant.imageUrl || ""}
                          alt={variant.name}
                          className="h-14 w-14 rounded-xl border border-zinc-200 object-cover"
                        />
                      )}

                      <div>
                        <div className="font-semibold text-zinc-900">
                          {variant.name}
                       </div>
                     <div className="mt-1 text-sm text-zinc-500">
                    SKU: {variant.sku}
                </div>

                {Array.isArray(variant.options) && variant.options.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {variant.options.map((option, index) => {
                      const optionName = option.name || option.option_name;
                      const optionValue = option.value || option.option_value;

                      return (
                        <span
                          key={`${optionName}-${optionValue}-${index}`}
                          className="rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200"
                        >
                          {optionName}: {optionValue}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

              <div className="flex flex-col items-end gap-3">
                <div className="grid grid-cols-3 gap-4 text-right text-sm">
                  <div>
                  <div className="text-zinc-500">Harga</div>
                <div className="font-semibold text-zinc-900">
                  {formatCurrency(variant.price)}
                </div>
              </div>

              <div>
                <div className="text-zinc-500">Stok</div>
                  <div className="font-semibold text-zinc-900">
                  {Number(variant.stock || 0)}
                  </div>
                </div>

              <div>
                <div className="text-zinc-500">Berat</div>
                 <div className="font-semibold text-zinc-900">
                 {variant.weight ? `${variant.weight} gr` : "-"}
                </div>
               </div>
              </div>

              {canEditProduct && (
               <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditVariant(variant)}
                  className="rounded-xl border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-white"
                >
               Edit
              </button>

              <button
                 type="button"
                 disabled={
                 createVariantMutation.isPending || updateVariantMutation.isPending
                }
                 onClick={() => {
                 const ok = window.confirm(
                 `Hapus variant "${variant.name}"?`
                );

                 if (!ok) return;

                deleteVariantMutation.mutate(variant.id);
               }}
                className="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
               >
                Hapus
             </button>
           </div>
          )}
          </div>
         </div>
        </div>
        ))}
        </div>
      )}
     </div>
    </div>
  </div>
 </div>
</div>
)}
</div>
);
}