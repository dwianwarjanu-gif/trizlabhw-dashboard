import { useEffect, useState } from "react";
import { categoryMappingsApi } from "@/services/api";

interface LocalCategory {
  id: string;
  name: string;
  slug: string;
}

interface CategoryMapping {
  id: string;
  local_category_id: string;
  local_category_name: string;
  marketplace_code: string;
  marketplace_category_id: string;
  marketplace_category_name: string;
  marketplace_path?: string;
}

export default function CategoryMappingsPage() {
  const [categories, setCategories] = useState<LocalCategory[]>([]);
  const [mappings, setMappings] = useState<CategoryMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewProductId, setPreviewProductId] = useState("");
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    local_category_id: "",
    local_category_name: "",
    marketplace_code: "SHOPEE",
    marketplace_category_id: "",
    marketplace_category_name: "",
    marketplace_path: "",
  });

  const loadData = async () => {
    try {
      const [categoriesRes, mappingsRes] = await Promise.all([
        categoryMappingsApi.getLocalCategories(),
        categoryMappingsApi.getMappings(),
      ]);

      setCategories(categoriesRes.data?.data || []);
      setMappings(mappingsRes.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmitMapping = async () => {
    if (!form.local_category_id) {
      alert("Pilih kategori lokal dulu");
      return;
    }

    if (!form.marketplace_category_id.trim()) {
      alert("Marketplace Category ID wajib diisi");
      return;
    }

    if (!form.marketplace_category_name.trim()) {
      alert("Marketplace Category Name wajib diisi");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...form,
        marketplace_category_id: form.marketplace_category_id.trim(),
        marketplace_category_name: form.marketplace_category_name.trim(),
        marketplace_path: form.marketplace_path.trim() || null,
      };

      if (editingId) {
        await categoryMappingsApi.updateMapping(editingId, payload);
      } else {
        await categoryMappingsApi.createMapping(payload);
      }

      setEditingId(null);
      setForm({
        local_category_id: "",
        local_category_name: "",
        marketplace_code: "SHOPEE",
        marketplace_category_id: "",
        marketplace_category_name: "",
        marketplace_path: "",
      });

      await loadData();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Gagal menyimpan mapping");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (mapping: CategoryMapping) => {
    setEditingId(mapping.id);

    setForm({
      local_category_id: mapping.local_category_id || "",
      local_category_name: mapping.local_category_name || "",
      marketplace_code: mapping.marketplace_code || "SHOPEE",
      marketplace_category_id: mapping.marketplace_category_id || "",
      marketplace_category_name: mapping.marketplace_category_name || "",
      marketplace_path: mapping.marketplace_path || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);

    setForm({
      local_category_id: "",
      local_category_name: "",
      marketplace_code: "SHOPEE",
      marketplace_category_id: "",
      marketplace_category_name: "",
      marketplace_path: "",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus mapping ini?")) return;

    try {
      await categoryMappingsApi.deleteMapping(id);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus mapping");
    }
  };

  const handlePreview = async () => {
    if (!previewProductId.trim()) {
      alert("Isi Product ID dulu");
      return;
    }

    try {
      setPreviewLoading(true);
      const res = await categoryMappingsApi.previewProductMapping(
        previewProductId.trim(),
        form.marketplace_code
      );
      setPreviewResult(res.data);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Gagal preview mapping");
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">
          Category Mapping Marketplace
        </h1>
        <p className="text-sm text-zinc-500">
          Mapping kategori lokal ke kategori marketplace.
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <select
            className="rounded-xl border p-3"
            value={form.local_category_id}
            onChange={(e) => {
              const category = categories.find(
                (x) => x.id === e.target.value
              );

              setForm({
                ...form,
                local_category_id: e.target.value,
                local_category_name: category?.name || "",
              });
            }}
          >
            <option value="">Pilih Kategori Lokal</option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>

          <select
            className="rounded-xl border p-3"
            value={form.marketplace_code}
            onChange={(e) =>
              setForm({
                ...form,
                marketplace_code: e.target.value,
              })
            }
          >
            <option value="SHOPEE">Shopee</option>
            <option value="TOKOPEDIA">Tokopedia</option>
            <option value="LAZADA">Lazada</option>
          </select>

          <input
            className="rounded-xl border p-3"
            placeholder="Marketplace Category ID"
            value={form.marketplace_category_id}
            onChange={(e) =>
              setForm({
                ...form,
                marketplace_category_id: e.target.value,
              })
            }
          />

          <input
            className="rounded-xl border p-3"
            placeholder="Marketplace Category Name"
            value={form.marketplace_category_name}
            onChange={(e) =>
              setForm({
                ...form,
                marketplace_category_name: e.target.value,
              })
            }
          />

          <input
            className="rounded-xl border p-3 md:col-span-2"
            placeholder="Marketplace Path"
            value={form.marketplace_path}
            onChange={(e) =>
              setForm({
                ...form,
                marketplace_path: e.target.value,
              })
            }
          />
        </div>

        <button
          onClick={handleSubmitMapping}
          disabled={
            loading ||
            !form.local_category_id ||
            !form.marketplace_category_id.trim() ||
            !form.marketplace_category_name.trim()
          }
          className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {loading ? "Menyimpan..." : editingId ? "Update Mapping" : "Simpan Mapping"}
        </button>

        {editingId && (
          <button
             onClick={handleCancelEdit}
             className="ml-3 mt-4 rounded-xl border px-5 py-3 text-zinc-700"
          >
             Batal
          </button>
         )}
      </div>
      
      <div className="rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900">
          Preview Mapping Produk
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Cek kategori marketplace yang akan dipakai saat produk disync.
        </p>

        <div className="mt-4 flex gap-3">
          <input
            className="flex-1 rounded-xl border p-3"
            placeholder="Product ID"
            value={previewProductId}
            onChange={(e) => setPreviewProductId(e.target.value)}
          />

           <button
             onClick={handlePreview}
             disabled={previewLoading}
             className="rounded-xl bg-zinc-900 px-5 py-3 text-white disabled:bg-zinc-300"
           >
             {previewLoading ? "Preview..." : "Preview Mapping"}
           </button>
         </div>

         {previewResult && (
           <div className="mt-4 rounded-xl bg-zinc-50 p-4 text-sm">
           <div>
             <b>Produk:</b> {previewResult.product?.name}
           </div>
           <div>
             <b>Kategori Lokal:</b> {previewResult.product?.category || "-"}
           </div>
           <div>
             <b>Marketplace:</b> {previewResult.marketplaceCode}
           </div>
           <div>
             <b>Resolved Category ID:</b> {previewResult.resolvedCategoryId || "-"}
           </div>
           <div>
             <b>Resolved Category Name:</b> {previewResult.resolvedCategoryName || "-"}
           </div>
         </div>
        )}
      </div>

      <div className="rounded-2xl border bg-white overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-50">
            <tr>
              <th className="p-4 text-left">Kategori Lokal</th>
              <th className="p-4 text-left">Marketplace</th>
              <th className="p-4 text-left">Kategori Marketplace</th>
              <th className="p-4 text-left">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {mappings.map((mapping) => (
              <tr
                key={mapping.id}
                className="border-t"
              >
                <td className="p-4">
                  {mapping.local_category_name}
                </td>

                <td className="p-4">
                  {mapping.marketplace_code}
                </td>

                <td className="p-4">
                  {mapping.marketplace_category_name}
                </td>

                <td className="p-4">
                  
                  <button
                    onClick={() => handleEdit(mapping)}
                    className="mr-2 rounded-lg bg-zinc-900 px-3 py-2 text-white"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(mapping.id)
                    }
                    className="rounded-lg bg-red-500 px-3 py-2 text-white"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}