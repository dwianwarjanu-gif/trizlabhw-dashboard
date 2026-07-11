import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";

import { inventoryApi } from "@/services/api";

type AICommandPaletteProps = {
  open: boolean;
  onClose: () => void;
};

export default function AICommandPalette({
  open,
  onClose,
}: AICommandPaletteProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiActions, setAiActions] = useState<any[]>([]);

  useEffect(() => {
    if (!open) return;

    setQuery("");
    setAiAnswer("");
    setAiActions([]);
    setAiLoading(false);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const commands = [
    { title: "Open Dashboard", description: "Lihat ringkasan toko", path: "/dashboard", icon: "📊" },
    { title: "Open Stock Center", description: "Inventory operations center", path: "/inventory", icon: "📦" },

    { title: "Open Executive KPI", description: "Executive dashboard inventory", path: "/inventory?tab=executive", icon: "📌" },
    { title: "Open Supplier Score", description: "Supplier performance score", path: "/inventory?tab=supplierScore", icon: "🏭" },
    { title: "Open Lead Time AI", description: "Prediksi ETA purchase order", path: "/inventory?tab=leadTime", icon: "⏱️" },
    { title: "Open Forecast AI v2", description: "Forecast seasonality dan stockout prediction", path: "/inventory?tab=forecastAi", icon: "🤖" },
    { title: "Open Current Stock", description: "Daftar stok produk saat ini", path: "/inventory?tab=inventory", icon: "📦" },
    { title: "Open Stock Movement", description: "Riwayat pergerakan stok", path: "/inventory?tab=movements", icon: "🔁" },
    { title: "Open Low Stock", description: "Produk stok rendah", path: "/inventory?tab=lowStock", icon: "⚠️" },
    { title: "Open Reorder", description: "Rekomendasi reorder", path: "/inventory?tab=reorder", icon: "🔄" },
    { title: "Open Restock Queue", description: "Queue request restock", path: "/inventory?tab=restockQueue", icon: "🧾" },
    { title: "Open Purchase Request", description: "Permintaan pembelian", path: "/inventory?tab=purchaseRequest", icon: "📝" },
    { title: "Open Purchase Order", description: "Purchase order supplier", path: "/inventory?tab=purchaseOrder", icon: "📨" },
    { title: "Open Suppliers", description: "Kelola supplier", path: "/inventory?tab=suppliers", icon: "🏢" },
    { title: "Open Return Center", description: "Retur inventory", path: "/inventory?tab=returns", icon: "↩️" },
    { title: "Open Auto Rules", description: "Aturan otomatis inventory", path: "/inventory?tab=autoRules", icon: "⚙️" },

    { title: "Open Products", description: "Kelola produk", path: "/products", icon: "🧊" },
    { title: "Open Orders", description: "Kelola pesanan", path: "/orders", icon: "🛒" },
    { title: "Open Marketplace", description: "Marketplace integration", path: "/marketplace", icon: "🏬" },
    { title: "Open Analytics", description: "Laporan dan grafik", path: "/analytics", icon: "📈" },
    { title: "Open Settings", description: "Pengaturan sistem", path: "/settings", icon: "⚙️" },
  ];

  const filteredCommands = commands.filter((command) => {
    const q = query.toLowerCase();
    return (
      command.title.toLowerCase().includes(q) ||
      command.description.toLowerCase().includes(q)
    );
  });

  const workflowKeywords = [
    "buat",
    "buatkan",
    "generate",
    "create",
    "restock",
    "approve",
    "setujui",
    "supplier",
    "forecast",
    "stockout",
    "lead time",
    "po",
    "purchase request",
    "purchase order",
    "ringkas",
    "summary",
  ];

  const isWorkflowQuery =
    query.trim().length > 0 &&
    workflowKeywords.some((word) => query.toLowerCase().includes(word));

  const runCommand = (command: any) => {
    navigate(command.path);
    onClose();
  };

  const askAI = async (overrideText?: string) => {
    const text = String(overrideText || query).trim();

    try {
      setAiLoading(true);
      setAiAnswer("");
      setAiActions([]);

      const sessionId =
        localStorage.getItem("ai_copilot_session_id") ||
        `command-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      localStorage.setItem("ai_copilot_session_id", sessionId);

      const res = await inventoryApi.askAiCopilot({
        sessionId,
        message: text,
      });

      const data = res.data || {};
      setAiAnswer(data.reply || "AI COO belum memberi jawaban.");
      setAiActions(data.actions || []);
    } catch (error: any) {
      setAiAnswer(
        error?.response?.data?.message ||
          "Gagal menghubungi AI COO. Coba lagi sebentar."
      );
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 px-4 pt-24 backdrop-blur-sm">
       <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/20 bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-zinc-100 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-xl text-white">
            🤖
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-zinc-900">
              TRIZLAB AI Command Palette
            </p>
            <p className="text-xs text-zinc-500">
              Ask AI or run a command
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 px-5 py-4">
          <Search className="h-5 w-5 text-zinc-400" />

          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}

            onKeyDown={(event) => {
              if (event.key === "Enter") {
                if (isWorkflowQuery) {
                  askAI();
                  return;
                }

                const first = filteredCommands[0];

                if (first) {
                  runCommand(first);
                  return;
                }

                askAI();
              }
            }}

            placeholder="Type a command or ask AI..."
            className="w-full bg-transparent text-base font-medium text-zinc-900 outline-none placeholder:text-zinc-400"
          />

          <div className="hidden rounded-lg border border-zinc-200 px-2 py-1 text-xs font-bold text-zinc-400 sm:block">
            ESC
          </div>
        </div>

<div className="border-t border-zinc-100 bg-zinc-50 px-5 py-4">
  <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
    Commands
  </p>

  <div className="mt-3 space-y-2">
    {(query.trim() ? filteredCommands : commands).map((command) => (
      <button
        key={command.title}
        onClick={() => runCommand(command)}
        className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-left hover:border-indigo-200 hover:bg-indigo-50"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-lg">
          {command.icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-zinc-900">
            {command.title}
          </p>
          <p className="text-xs text-zinc-500">
            {command.description}
          </p>
        </div>
      </button>
    ))}

    {query.trim() && (filteredCommands.length === 0 || isWorkflowQuery) && !aiAnswer && (
      <button
        onClick={askAI}
        disabled={aiLoading}
        className="flex w-full items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-left hover:bg-indigo-100 disabled:opacity-60"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
          🤖
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-indigo-900">
            Ask AI COO
         </p>
          <p className="text-xs text-indigo-700">
            {aiLoading ? "AI COO sedang menganalisis..." : query}
          </p>
        </div>
      </button>
    )}

{aiAnswer && (
  <div className="mt-3 rounded-2xl border border-indigo-100 bg-white p-4">
    <p className="text-xs font-black uppercase tracking-wide text-indigo-600">
      AI COO Answer
    </p>

    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
      {aiAnswer}
    </p>

    {aiActions.length > 0 && (
      <div className="mt-3 flex flex-wrap gap-2">
        {aiActions.map((action) => (
          <button
            key={`${action.actionType}-${action.label}`}
            onClick={async () => {
              const aiExecutableActions = [
                "CONFIRM_CREATE_RESTOCK",
                "WORKFLOW_APPROVE_RESTOCK",
                "APPROVE_PURCHASE_REQUEST",
                "CONFIRM_CREATE_PR",
              ];

              if (aiExecutableActions.includes(action.actionType)) {
                const actionMessageMap: Record<string, string> = {
                  CONFIRM_CREATE_RESTOCK: "ya",
                  WORKFLOW_APPROVE_RESTOCK: "approve",
                  APPROVE_PURCHASE_REQUEST: "approve purchase request",
                  CONFIRM_CREATE_PR: "ya",
                };

                const nextMessage = actionMessageMap[action.actionType] || action.label;
                setQuery(nextMessage);
                await askAI(nextMessage);
                return;
              }

              navigate(actionMap[action.actionType] || "/dashboard");
              onClose();
            }}
            className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white hover:bg-indigo-700"
          >
            {action.label}
          </button>
        ))}
      </div>
    )}
  </div>
)}
   </div>
  </div>
      </div>
    </div>
  );
}