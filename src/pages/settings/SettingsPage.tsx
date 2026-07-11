import { useEffect, useState } from "react";
import { settingsApi } from "@/services/api";

const defaultForm = {
  store_name: "",
  store_email: "",
  store_phone: "",
  store_address: "",
  store_logo_url: "",

  auto_sync_enabled: "false",
  sync_order_enabled: "true",
  sync_stock_enabled: "true",
  stock_buffer: "5",

  default_marketplace: "SHOPEE",
  default_publish_status: "DRAFT",
  default_weight: "1000",
};

export default function SettingsPage() {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);

  const loadSettings = async () => {
    const res = await settingsApi.getSettings();
    setForm({ ...defaultForm, ...(res.data?.data || {}) });
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const saveSettings = async () => {
    try {
      setLoading(true);
      await settingsApi.updateSettings(form);
      toast.success("Pengaturan berhasil disimpan");
      await loadSettings();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan settings");
    } finally {
      setLoading(false);
    }
  };

  const update = (key: keyof typeof defaultForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Pengaturan</h1>
        <p className="text-sm text-zinc-500">
          Kelola profil toko, sinkronisasi, dan default marketplace.
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Profil Toko</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input className="rounded-xl border p-3" placeholder="Nama Toko" value={form.store_name} onChange={(e) => update("store_name", e.target.value)} />
          <input className="rounded-xl border p-3" placeholder="Email" value={form.store_email} onChange={(e) => update("store_email", e.target.value)} />
          <input className="rounded-xl border p-3" placeholder="No HP" value={form.store_phone} onChange={(e) => update("store_phone", e.target.value)} />
          <input className="rounded-xl border p-3" placeholder="Logo URL" value={form.store_logo_url} onChange={(e) => update("store_logo_url", e.target.value)} />
          <textarea className="rounded-xl border p-3 md:col-span-2" placeholder="Alamat" value={form.store_address} onChange={(e) => update("store_address", e.target.value)} />
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Sync Settings</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <select className="rounded-xl border p-3" value={form.auto_sync_enabled} onChange={(e) => update("auto_sync_enabled", e.target.value)}>
            <option value="true">Auto Sync Aktif</option>
            <option value="false">Auto Sync Nonaktif</option>
          </select>

          <select className="rounded-xl border p-3" value={form.sync_order_enabled} onChange={(e) => update("sync_order_enabled", e.target.value)}>
            <option value="true">Sync Order Aktif</option>
            <option value="false">Sync Order Nonaktif</option>
          </select>

          <select className="rounded-xl border p-3" value={form.sync_stock_enabled} onChange={(e) => update("sync_stock_enabled", e.target.value)}>
            <option value="true">Sync Stock Aktif</option>
            <option value="false">Sync Stock Nonaktif</option>
          </select>

          <input className="rounded-xl border p-3" placeholder="Buffer Stok" value={form.stock_buffer} onChange={(e) => update("stock_buffer", e.target.value)} />
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Marketplace Defaults</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <select className="rounded-xl border p-3" value={form.default_marketplace} onChange={(e) => update("default_marketplace", e.target.value)}>
            <option value="SHOPEE">Shopee</option>
            <option value="TOKOPEDIA">Tokopedia</option>
            <option value="LAZADA">Lazada</option>
          </select>

          <select className="rounded-xl border p-3" value={form.default_publish_status} onChange={(e) => update("default_publish_status", e.target.value)}>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
          </select>

          <input className="rounded-xl border p-3" placeholder="Berat Default gram" value={form.default_weight} onChange={(e) => update("default_weight", e.target.value)} />
        </div>
      </div>

      <button
        onClick={saveSettings}
        disabled={loading}
        className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white disabled:bg-zinc-300"
      >
        {loading ? "Menyimpan..." : "Simpan Pengaturan"}
      </button>
    </div>
  );
}