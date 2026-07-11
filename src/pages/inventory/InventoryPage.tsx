import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Loader2, RefreshCcw, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  LineChart,
  Line,
} from "recharts";

import Can from "@/components/auth/Can";
import { inventoryApi } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

type InventoryItem = {
  id: number | string;
  productId?: string;
  variantId?: string;
  productName?: string;
  sku?: string;
  stock?: number;
  minStockLevel?: number;
  availableStock?: number;
  reservedStock?: number;
  updatedAt?: string;
};

type StockMovement = {
  id: string;
  product_id: string;
  product_name?: string | null;
  sku?: string | null;
  movement_type: string;
  quantity: number;
  stock_before: number;
  stock_after: number;
  source_type?: string;
  reason?: string | null;
  created_at?: string;
  metadata?: any;
};

type RestockRequest = {
  id: string;

  // camelCase
  productId?: string;
  productName?: string;
  currentStock?: number;
  minStock?: number;
  recommendedQty?: number;
  requestedQty?: number;
  createdAt?: string;

  // snake_case dari DB
  product_id?: string;
  product_name?: string;
  current_stock?: number;
  min_stock?: number;
  gap_qty?: number;
  requested_qty?: number;
  recommended_qty?: number;
  created_at?: string;

  sku?: string;
  gap?: number;
  reason?: string;

  status: "PENDING" | "APPROVED" | "REJECTED" | "DONE";
};

function extractInventory(data: any): InventoryItem[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.inventory)) return data.inventory;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getMovementTypeClass(type?: string) {
  const value = String(type || "").toUpperCase();

  if (value === "ADJUSTMENT") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  if (value === "SALE" || value === "ORDER") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (value === "RETURN") {
    return "bg-green-50 text-green-700 border-green-200";
  }

  if (value === "SYNC" || value === "MARKETPLACE_SYNC") {
    return "bg-purple-50 text-purple-700 border-purple-200";
  }

  if (value === "RESTOCK" || value === "STOCK_IN" || value === "PURCHASE") {
    return "bg-yellow-50 text-yellow-700 border-yellow-200";
  }

  if (value === "TRANSFER") {
    return "bg-cyan-50 text-cyan-700 border-cyan-200";
  }

  return "bg-zinc-50 text-zinc-700 border-zinc-200";
}

function getLowStockStatusClass(status?: string) {
  const value = String(status || "").toUpperCase();

  if (value === "OUT_OF_STOCK") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (value === "LOW_STOCK") {
    return "bg-orange-50 text-orange-700 border-orange-200";
  }

  if (value === "WARNING") {
    return "bg-yellow-50 text-yellow-700 border-yellow-200";
  }

  return "bg-green-50 text-green-700 border-green-200";
}

function getLowStockStatusLabel(status?: string) {
  const value = String(status || "").toUpperCase();

  if (value === "OUT_OF_STOCK") return "Out of Stock";
  if (value === "LOW_STOCK") return "Low Stock";
  if (value === "WARNING") return "Warning";

  return "Healthy";
}

function getPurchaseRequestStatusClass(status?: string) {
  const value = String(status || "").toUpperCase();

  if (value === "DRAFT") return "bg-slate-50 text-slate-700 border-slate-200";
  if (value === "APPROVED") return "bg-blue-50 text-blue-700 border-blue-200";
  if (value === "ORDERED") return "bg-purple-50 text-purple-700 border-purple-200";
  if (value === "RECEIVED") return "bg-green-50 text-green-700 border-green-200";
  if (value === "CANCELLED") return "bg-red-50 text-red-700 border-red-200";

  return "bg-zinc-50 text-zinc-700 border-zinc-200";
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const { permissions, user } = useAuth();
  const location = useLocation();

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
  const isAdmin = role === "ADMIN";

  const effectivePermissions =
    permissions?.length > 0 ? permissions : storedPermissions;

  const canEditInventory =
    isAdmin ||
    effectivePermissions.includes("inventory.update") ||
    effectivePermissions.includes("inventory.edit");

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [stockDraft, setStockDraft] = useState(0);

  const [activeTab, setActiveTab] = useState<
    | "executive"
    | "supplierScore"
    | "leadTime"
    | "forecastAi"
    | "inventory"
    | "movements"
    | "lowStock"
    | "reorder"
    | "restockQueue"
    | "purchaseRequest"
    | "autoRules"
    | "purchaseOrder"
    | "suppliers"
    | "returns"
  >("executive");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");

    const allowedTabs = [
      "executive",
      "supplierScore",
      "leadTime",
      "forecastAi",
      "inventory",
      "movements",
      "lowStock",
      "reorder",
      "restockQueue",
      "purchaseRequest",
      "purchaseOrder",
      "suppliers",
      "returns",
      "autoRules",
    ];

    if (tab && allowedTabs.includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [location.search]);

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [movementSearch, setMovementSearch] = useState("");
  const [movementSource, setMovementSource] = useState("");
  const [movementType, setMovementType] = useState("");
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);
  const [restockRequests, setRestockRequests] = useState<RestockRequest[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [returns, setReturns] = useState([]);
  const [returnSearch, setReturnSearch] = useState("");
  const [returnTypeFilter, setReturnTypeFilter] = useState("ALL");
  const [returnStatusFilter, setReturnStatusFilter] = useState("ALL");
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [showGeneratePoModal, setShowGeneratePoModal] = useState(false);
  const [selectedPurchaseRequest, setSelectedPurchaseRequest] = useState<any | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [poNote, setPoNote] = useState("");
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
  const [showReturnDetailModal, setShowReturnDetailModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [returnDashboard, setReturnDashboard] = useState<any | null>(null);
  const [executiveDashboard, setExecutiveDashboard] = useState<any | null>(null);
  const [aiSummary, setAiSummary] = useState<any | null>(null);
  const [loadingAiSummary, setLoadingAiSummary] = useState(false);
  const [supplierPerformance, setSupplierPerformance] = useState<any[]>([]);
  const [loadingSupplierPerformance, setLoadingSupplierPerformance] = useState(false);
  const [leadTimePrediction, setLeadTimePrediction] = useState<any[]>([]);
  const [leadTimeSummary, setLeadTimeSummary] = useState<any>(null);
  const [loadingLeadTime, setLoadingLeadTime] = useState(false);
  const [forecastAi, setForecastAi] = useState<any[]>([]);
  const [loadingForecastAi, setLoadingForecastAi] = useState(false);
  const [loadingExecutiveDashboard, setLoadingExecutiveDashboard] = useState(false);
  const [showAiCopilot, setShowAiCopilot] = useState(false);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotSessionId, setCopilotSessionId] = useState("");
  const [autonomousReports, setAutonomousReports] = useState([]);
  const [autonomousLoading, setAutonomousLoading] = useState(false);
  const [runningAutonomous, setRunningAutonomous] = useState(false);  
  const [selectedAutonomousReport, setSelectedAutonomousReport] = useState<any | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [copilotMessages, setCopilotMessages] = useState<any[]>([
    {
      role: "assistant",
      content:
        "Halo 👋 Saya AI COO. Saya bisa membantu menjelaskan Forecast AI, Supplier Score, Lead Time, KPI, maupun kondisi inventory Anda.",
    },
  ]);

  const [supplierForm, setSupplierForm] = useState({
    supplierCode: "",
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    status: "ACTIVE",
  });
  const [loadingRestock, setLoadingRestock] = useState(false);
  const [autoRules, setAutoRules] = useState<any[]>([]);
  const [autoRuleStats, setAutoRuleStats] = useState<any | null>(null);
  const [runningAutoRules, setRunningAutoRules] = useState(false);
  const [productOptions, setProductOptions] = useState<any[]>([]);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState<any | null>(null);

  const [ruleForm, setRuleForm] = useState({
    productId: "",
    productName: "",
    sku: "",
    triggerStock: 5,
    reorderQty: 10,
    autoCreatePr: false,
  });
  const [returnForm, setReturnForm] = useState({
    returnType: "CUSTOMER",
    productId: "",
    productName: "",
    sku: "",
    qty: 1,
    reason: "",
  });
  const [selectedReturnSupplierId, setSelectedReturnSupplierId] = useState("");

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const res = await inventoryApi.getAll();
      return extractInventory(res.data);
    },
  });

  const inventory = data || [];

  const filteredInventory = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return inventory;

    return inventory.filter((item) => {
      return (
        item.productName?.toLowerCase().includes(q) ||
        item.sku?.toLowerCase().includes(q) ||
        item.productId?.toLowerCase().includes(q)
      );
    });
  }, [inventory, search]);

  const lowStockItems = useMemo(() => {
    return inventory
      .map((item) => {
        const stock = Number(item.stock || 0);
        const minStock = Number(item.minStockLevel || 0);
        const gap = Math.max(minStock - stock, 0);

        let status = "HEALTHY";

        if (minStock > 0 && stock <= 0) {
        status = "OUT_OF_STOCK";
      } else if (minStock > 0 && stock < minStock) {
        status = "LOW_STOCK";
      } else if (minStock > 0 && stock === minStock) {
        status = "WARNING";
      }

      return {
        ...item,
        stock,
        minStock,
        gap,
        status,
      };
    })
    .filter((item) => item.status !== "HEALTHY")
    .sort((a, b) => {
      const rank = {
        OUT_OF_STOCK: 1,
        LOW_STOCK: 2,
        WARNING: 3,
        HEALTHY: 4,
      };

      return rank[a.status] - rank[b.status];
    });
  }, [inventory]);

  const reorderRecommendations = useMemo(() => {
    return lowStockItems.map((item) => {
      const stock = Number(item.stock || 0);
      const minStock = Number(item.minStock || 0);
      const gap = Math.max(minStock - stock, 0);

      const recommendedQty =
        item.status === "OUT_OF_STOCK"
          ? Math.max(minStock * 2, 1)
          : item.status === "LOW_STOCK"
          ? Math.max(gap + minStock, gap)
          : 0;

      return {
        ...item,
        recommendedQty,
      };
    })
    .filter((item) => Number(item.recommendedQty || 0) > 0);
  }, [lowStockItems]);

  const movementStats = useMemo(() => {
    const today = new Date().toDateString();

    const todayCount = movements.filter((m) => {
      if (!m.created_at) return false;
      return new Date(m.created_at).toDateString() === today;
    }).length;

    const manualCount = movements.filter(
      (m) => String(m.source_type || "").toUpperCase() === "MANUAL"
    ).length;

    const orderCount = movements.filter((m) => {
      const source = String(m.source_type || "").toUpperCase();
      const type = String(m.movement_type || "").toUpperCase();

      return source === "ORDER" || type === "SALE" || type === "ORDER";
    }).length;

    const syncCount = movements.filter((m) => {
      const source = String(m.source_type || "").toUpperCase();
      const type = String(m.movement_type || "").toUpperCase();

      return source === "SYNC" || source === "API" || type === "SYNC";
    }).length;

    return {
      todayCount,
      manualCount,
      orderCount,
      syncCount,
    };
  }, [movements]);

  const movementChartData = useMemo(() => {
    const map = new Map<string, number>();

    movements.forEach((m) => {
      if (!m.created_at) return;

      const date = new Date(m.created_at).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      });

      map.set(date, (map.get(date) || 0) + Math.abs(Number(m.quantity || 0)));
    });

    return Array.from(map.entries())
      .map(([date, qty]) => ({
        date,
        qty,
      }))
      .reverse();
  }, [movements]);

  const returnStats = useMemo(() => {
    const summary = returnDashboard?.summary || {};

    return {
      total: Number(summary.total_returns || 0),
      pending: Number(summary.pending || 0),
      approved: Number(summary.approved || 0),
      completed: Number(summary.completed || 0),
      customerReturns: Number(summary.customer_returns || 0),
      supplierReturns: Number(summary.supplier_returns || 0),
      qtyReturned: Number(summary.qty_returned || 0),
      qtySentBack: Number(summary.qty_sent_back || 0),
    };
  }, [returnDashboard]);

  const returnReasonStats = useMemo(() => {
    return (returnDashboard?.reasons || []).map((item: any) => ({
      reason: item.reason || "Tanpa alasan",
      count: Number(item.count || 0),
    }));
  }, [returnDashboard]);

  const returnChartData = useMemo(() => {
    return (returnDashboard?.trend || []).map((item: any) => ({
      date: item.date
        ? new Date(item.date).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
          })
        : "-",
      customerReturns: Number(item.customer_returns || 0),
      supplierReturns: Number(item.supplier_returns || 0),
      qtyReturned: Number(item.qty_returned || 0),
      qtySentBack: Number(item.qty_sent_back || 0),
    }));
  }, [returnDashboard]);

  const filteredReturns = useMemo(() => {
    return returns.filter((item: any) => {
      const q = returnSearch.trim().toLowerCase();

      const returnNumber = String(item.return_number || "").toLowerCase();
      const productName = String(item.product_name || "").toLowerCase();
      const supplierName = String(item.supplier_name || "").toLowerCase();
      const reason = String(item.reason || "").toLowerCase();

      const type = String(item.return_type || "").toUpperCase();
      const status = String(item.status || "").toUpperCase();

      const matchSearch =
        !q ||
        returnNumber.includes(q) ||
        productName.includes(q) ||
        supplierName.includes(q) ||
        reason.includes(q);

      const matchType =
        returnTypeFilter === "ALL" ||
        type === returnTypeFilter;

      const matchStatus =
        returnStatusFilter === "ALL" ||
        status === returnStatusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [returns, returnSearch, returnTypeFilter, returnStatusFilter]);

  const loadMovements = async () => {
    try {
      setLoadingMovements(true);

      const res = await inventoryApi.getMovements({
        page: 1,
        limit: 50,
        ...(movementSearch.trim() ? { search: movementSearch.trim() } : {}),
        ...(movementSource ? { sourceType: movementSource } : {}),
        ...(movementType ? { type: movementType } : {}),
      });

      setMovements(res.data?.movements || res.data?.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Gagal memuat stock movement");
    } finally {
      setLoadingMovements(false);
    }
  };
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [copilotMessages, copilotLoading]);

  useEffect(() => {
    if (activeTab !== "movements") return;

    const timer = setTimeout(() => {
      loadMovements();
    }, 400);

    return () => clearTimeout(timer);
  }, [activeTab, movementSearch, movementSource, movementType]);

  useEffect(() => {
    if (!copilotLoading) {
      inputRef.current?.focus();
    }
  }, [copilotLoading]);

  useEffect(() => {
    loadAiSummary();
  }, []);

  useEffect(() => {
    loadAutonomousReports();
  }, []);

  useEffect(() => {
    const existingSessionId = localStorage.getItem("ai_copilot_session_id");

    if (existingSessionId) {
      setCopilotSessionId(existingSessionId);
      return;
    }

    const newSessionId = `web-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;

    localStorage.setItem("ai_copilot_session_id", newSessionId);
    setCopilotSessionId(newSessionId);
  }, []);

  useEffect(() => {
    if (
      activeTab === "restockQueue" ||
      activeTab === "purchaseRequest"
    ) {
      loadRestockAndPurchase();
      loadAutonomousReports();
    }

    if (activeTab === "autoRules") {
      loadAutoRules();
      loadAutoRuleStats();
      loadProductOptions();
      loadAutonomousReports();
    }

    if (activeTab === "returns") {
      loadReturns();
      loadReturnDashboard();
      loadProductOptions();
      loadAutonomousReports();
    }

    if (activeTab === "purchaseOrder") {
      loadPurchaseOrders();
      loadAutonomousReports();
    }

    if (activeTab === "suppliers") {
      loadSuppliers();
      loadAutonomousReports();
    }

    if (activeTab === "supplierScore") {
      loadSupplierPerformance();
      loadAutonomousReports();
    }

    if (activeTab === "leadTime") {
      loadLeadTimePrediction();
      loadAutonomousReports();
    }

    if (activeTab === "forecastAi") {
      loadForecastAi();
      loadAutonomousReports();
    }
  }, [activeTab]);

  const loadSupplierPerformance = async () => {
    try {
      setLoadingSupplierPerformance(true);

      const res = await inventoryApi.getSupplierPerformance();

      setSupplierPerformance(
        res?.data?.suppliers ??
        res?.data?.data ??
        []
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSupplierPerformance(false);
    }
  };

  const loadLeadTimePrediction = async () => {
    try {
      setLoadingLeadTime(true);

      const res = await inventoryApi.getLeadTimePrediction();

      setLeadTimePrediction(
        res.data?.predictions ||
        res.data?.data ||
        []
      );

      setLeadTimeSummary(res.data?.summary || {});
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat Lead Time Prediction");
    } finally {
      setLoadingLeadTime(false);
    }
  };

  const loadForecastAi = async () => {
    try {
      setLoadingForecastAi(true);

      const res = await inventoryApi.getForecastSeasonality({
        days: 60,
        horizonDays: 30,
      });

      setForecastAi(res.data?.forecast || res.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat Forecast AI v2");
    } finally {
      setLoadingForecastAi(false);
    }
  };

  const loadExecutiveDashboard = async () => {
    try {
      setLoadingExecutiveDashboard(true);

      const res = await inventoryApi.getExecutiveDashboard();

      setExecutiveDashboard(res.data?.dashboard || null);
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.message ||
        "Gagal memuat Executive Dashboard"
      );
    } finally {
      setLoadingExecutiveDashboard(false);
    }
  };

  const loadAiSummary = async () => {
    try {
      setLoadingAiSummary(true);

      const res = await inventoryApi.getAiSummary();

      setAiSummary(res.data || null);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat AI Executive Summary");
    } finally {
      setLoadingAiSummary(false);
    }
  };

  const loadReturns = async () => {
    try {
      const res = await inventoryApi.getReturns();

      setReturns(
        res.data?.returns ||
        res.data?.data ||
        []
      );
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Gagal memuat returns");
    }
  };

  const createReturn = async () => {
    try {
      if (returnForm.returnType === "SUPPLIER" && !selectedReturnSupplierId) {
        toast.error("Supplier wajib dipilih untuk supplier return");
        return;
      }

      await inventoryApi.createReturn({
        ...returnForm,
        supplierId:
          returnForm.returnType === "SUPPLIER"
            ? selectedReturnSupplierId
            : null,
      });

      toast.success("Return created");
      setShowReturnModal(false);
      setSelectedReturnSupplierId("");

      setReturnForm({
        returnType: "CUSTOMER",
        productId: "",
        productName: "",
        sku: "",
        qty: 1,
        reason: "",
      });

      await Promise.all([
        loadReturns(),
        loadReturnDashboard(),
        refetch(),
        loadMovements(),
      ]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed create return");
    }
  };

  const loadReturnDashboard = async () => {
    try {
      const res = await inventoryApi.getReturnDashboard();
      setReturnDashboard(res.data?.dashboard || null);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat return dashboard");
    }
  };

  const updateReturnStatus = async (id: string, status: string) => {
    try {
      await inventoryApi.updateReturnStatus(id, status);

      toast.success(`Return ${status}`);

      await Promise.all([
        loadReturns(),
        loadReturnDashboard(),
        refetch(),
        loadMovements(),
      ]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed update return");
    }
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editing) return null;
      return inventoryApi.updateStock(String(editing.productId || editing.id), {
        stock_quantity: stockDraft,
      });
    },
    onSuccess: async () => {
      toast.success("Stok berhasil diupdate");
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ["inventory"] });

      if (activeTab === "movements") {
        await loadMovements();
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal update stok");
    },
  });

  const openEdit = (item: InventoryItem) => {
    if (!canEditInventory) return;
    setEditing(item);
    setStockDraft(Number(item.stock || 0));
  };

  const handleRefresh = () => {
    if (activeTab === "executive") {
      loadAiSummary();
      loadExecutiveDashboard();
      return;
    }

    if (activeTab === "movements") {
      loadMovements();
      return;
    }

    if (activeTab === "executive") {
      loadExecutiveDashboard();
      return;
    }

    if (activeTab === "leadTime") {
      loadLeadTimePrediction();
      return;
    }

    if (activeTab === "forecastAi") {
      loadForecastAi();
      return;
    }
    refetch();
  };

  const loadRestockAndPurchase = async () => {
    try {
      setLoadingRestock(true);

      const [restockRes, purchaseRes] = await Promise.all([
        inventoryApi.getRestockRequests(),
        inventoryApi.getPurchaseRequests(),
      ]);

      setRestockRequests(restockRes.data?.restockRequests || restockRes.data?.data || []);
      setPurchaseRequests(purchaseRes.data?.purchaseRequests || purchaseRes.data?.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Gagal memuat restock data");
    } finally {
      setLoadingRestock(false);
    }
  };

  const loadAutoRules = async () => {
    try {
      const res = await inventoryApi.getAutoReorderRules();

      setAutoRules(
        res.data?.rules ||
        res.data?.data ||
        []
      );
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat auto reorder rules");
    }
  };

  const loadAutoRuleStats = async () => {
    try {
      const res = await inventoryApi.getAutoReorderStats();
      setAutoRuleStats(res.data?.stats || null);
    } catch (err) {
      console.error(err);
    }
  };

  const loadProductOptions = async () => {
    try {
      const res = await inventoryApi.getAll();

      const products =
        res.data?.inventory ||
        res.data?.data ||
        [];

      setProductOptions(products);
      console.log("PRODUCT OPTIONS", products);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat produk");
    }
  };

  const loadPurchaseOrders = async () => {
    try {
      const res = await inventoryApi.getPurchaseOrders();
      setPurchaseOrders(res.data?.purchaseOrders || res.data?.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Gagal memuat Purchase Order");
    }
  };

  const loadSuppliers = async () => {
    try {
      const res = await inventoryApi.getSuppliers();
      setSuppliers(res.data?.suppliers || res.data?.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Gagal memuat supplier");
    }
  };

  const saveSupplier = async () => {
    try {
      if (!supplierForm.name.trim()) {
        toast.error("Nama supplier wajib diisi");
        return;
      }

      if (editingSupplier) {
        await inventoryApi.updateSupplier(editingSupplier.id, supplierForm);
        toast.success("Supplier berhasil diupdate");
      } else {
        await inventoryApi.createSupplier(supplierForm);
        toast.success("Supplier berhasil dibuat");
      }

      setShowSupplierForm(false);
      setEditingSupplier(null);

      setSupplierForm({
        supplierCode: "",
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
        status: "ACTIVE",
      });

      await loadSuppliers();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Gagal menyimpan supplier");
    }
  };

  const deleteSupplier = async (id: string) => {
    if (!confirm("Hapus supplier ini?")) return;

    try {
      await inventoryApi.deleteSupplier(id);
      toast.success("Supplier berhasil dihapus");
      await loadSuppliers();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Gagal menghapus supplier");
    }
  };

  const createRestockRequest = async (item: any) => {
    try {
      const exists = restockRequests.some(
        (request) =>
          request.product_id === (item.productId || item.id) &&
          request.status !== "REJECTED"
      );

      if (exists) {
        toast.error("Produk ini sudah ada di Restock Queue");
        return;
      }

      await inventoryApi.createRestockRequest({
        product_id: item.productId || item.id,
        product_name: item.productName || "-",
        sku: item.sku || "-",
        current_stock: Number(item.stock || 0),
        min_stock: Number(item.minStock || 0),
        gap_qty: Number(item.gap || 0),
        recommended_qty: Number(item.recommendedQty || 0),
        requested_qty: Number(item.recommendedQty || 0),
        reason:
          item.status === "OUT_OF_STOCK"
            ? "Stok habis, restock urgent."
            : "Stok di bawah minimum, perlu restock.",
      });

      toast.success("Restock request masuk queue");
      await loadRestockAndPurchase();
      setActiveTab("restockQueue");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Gagal membuat restock request");
    }
  };

  const updateRestockStatus = async (
    id: string,
    status: RestockRequest["status"]
  ) => {
    try {
      await inventoryApi.updateRestockRequestStatus(id, status);
      toast.success(`Restock request ${status.toLowerCase()}`);

      await loadRestockAndPurchase();

      if (status === "APPROVED") {
        setActiveTab("purchaseRequest");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Gagal update restock request");
    }
  };

  const updatePurchaseRequestStatus = async (id: string, status: string) => {
    try {
      await inventoryApi.updatePurchaseRequestStatus(id, status);
      toast.success(`Purchase Request ${status.toLowerCase()}`);
      await loadRestockAndPurchase();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Gagal update Purchase Request");
    }
  };

  const updatePurchaseOrderStatus = async (id: string, status: string) => {
    try {
      const res = await inventoryApi.updatePurchaseOrderStatus(id, status);

      toast.success(`Purchase Order ${status.toLowerCase()}`);

      await Promise.all([
        loadPurchaseOrders(),
        loadRestockAndPurchase(),
        refetch(),
      ]);

      if (res.data?.stockMovementId) {
        await loadMovements();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Gagal update Purchase Order");
    }
  };

  const createAutoRule = async () => {
    try {
      await inventoryApi.createAutoReorderRule(ruleForm);

      toast.success("Auto reorder rule berhasil dibuat");

      setShowRuleForm(false);

      await loadAutoRules();

      setRuleForm({
        productId: "",
        productName: "",
        sku: "",
        triggerStock: 5,
        reorderQty: 10,
        autoCreatePr: false,
      });
    } catch (err: any) {
      console.error(err);

      toast.error(
        err?.response?.data?.message ||
        "Gagal membuat rule"
      );
    }
  };

  const toggleAutoRule = async (rule: any) => {
    try {
      await inventoryApi.updateAutoReorderRule(rule.id, {
        enabled: !Boolean(rule.enabled),
      });

      toast.success(Boolean(rule.enabled) ? "Rule dinonaktifkan" : "Rule diaktifkan");
      await loadAutoRules();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Gagal update rule");
    }
  };

  const deleteAutoRule = async (rule: any) => {
    if (!confirm(`Hapus rule ${rule.product_name || rule.productName}?`)) return;

    try {
      await inventoryApi.deleteAutoReorderRule(rule.id);
      toast.success("Rule berhasil dihapus");
      await loadAutoRules();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Gagal hapus rule");
    }
  };

  const startEditRule = (rule: any) => {
    setEditingRule(rule);
    setRuleForm({
      productId: rule.product_id,
      productName: rule.product_name,
      sku: rule.sku || "",
      triggerStock: Number(rule.trigger_stock || 0),
      reorderQty: Number(rule.reorder_qty || 0),
      autoCreatePr: Boolean(rule.auto_create_pr),
    });
    setShowRuleForm(true);
  };

  const saveRule = async () => {
    if (!editingRule) {
      await createAutoRule();
      return;
    }

    try {
      await inventoryApi.updateAutoReorderRule(editingRule.id, {
        triggerStock: ruleForm.triggerStock,
        reorderQty: ruleForm.reorderQty,
        autoCreatePr: ruleForm.autoCreatePr,
      });

      toast.success("Rule berhasil diupdate");
      setEditingRule(null);
      setShowRuleForm(false);
      await loadAutoRules();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Gagal update rule");
    }
  };

  const runAutoReorderRules = async () => {
    try {
      setRunningAutoRules(true);

      const res = await inventoryApi.runAutoReorderRules();

      const triggered = res.data?.triggered ?? 0;
      const skipped = res.data?.skipped ?? 0;

      toast.success(`Auto reorder selesai: ${triggered} dibuat, ${skipped} dilewati`);

      await Promise.all([
        loadAutoRules(),
        loadAutoRuleStats(),
        loadRestockAndPurchase(),
        refetch(),
      ]);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Gagal menjalankan auto reorder");
    } finally {
      setRunningAutoRules(false);
    }
  };

  const generatePurchaseOrder = async () => {
    if (!selectedPurchaseRequest) return;

    if (!selectedSupplierId) {
      toast.error("Pilih supplier dulu");
      return;
    }

    try {
      await inventoryApi.generatePurchaseOrder(selectedPurchaseRequest.id, {
        supplierId: selectedSupplierId,
        note: poNote || "Generated from Purchase Request",
      });

      toast.success("Purchase Order berhasil dibuat");

      setShowGeneratePoModal(false);
      setSelectedPurchaseRequest(null);
      setSelectedSupplierId("");
      setPoNote("");

      await Promise.all([
        loadPurchaseOrders(),
        loadRestockAndPurchase(),
      ]);

      setActiveTab("purchaseOrder");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Gagal generate Purchase Order");
    }
  };

  const openGeneratePoModal = async (item: any) => {
    setSelectedPurchaseRequest(item);
    setSelectedSupplierId("");
    setPoNote(`Generated from ${item.pr_number || item.prNumber || "Purchase Request"}`);
    await loadSuppliers();
    setShowGeneratePoModal(true);
  };
  
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const sendCopilot = async (message?: string) => {
    const text = (message ?? copilotInput).trim();
    if (!text) return;

    setCopilotMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: text,
      },
    ]);

    setCopilotInput("");
    setCopilotLoading(true);

    try {
      const sessionId =
        copilotSessionId ||
        localStorage.getItem("ai_copilot_session_id") ||
        `web-${Date.now()}`;

      const res = await inventoryApi.askAiCopilot({
        sessionId,
        message: text,
      });

      if (res.data?.sessionId && res.data.sessionId !== copilotSessionId) {
        localStorage.setItem("ai_copilot_session_id", res.data.sessionId);
        setCopilotSessionId(res.data.sessionId);
      }

      const data = res.data;
      const streamLines =
        Array.isArray(data.stream) && data.stream.length > 0
          ? data.stream
          : String(data.reply || "").split("\n").filter(Boolean);

      const assistantMessageId = `assistant-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

      setCopilotMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          actions: [],
          isStreaming: true,
        },
      ]);

      setCopilotLoading(false);

      let streamedContent = "";

      for (const line of streamLines) {
        streamedContent += streamedContent ? `\n${line}` : line;

        setCopilotMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: streamedContent,
                }
              : msg
            )
          );

          await sleep(220);
        }

        setCopilotMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                ...msg,
                content: data.reply,
                actions: data.actions || [],
                isStreaming: false,
              }
            : msg
          )  
        );
    } catch {
      setCopilotMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Maaf, AI COO sedang tidak dapat dihubungi.",
        }, 
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  const openReturnDetail = (item: any) => {
    setSelectedReturn(item);
    setShowReturnDetailModal(true);
  };

  const getWorkflowUserLabel = (value?: string | null) => {
    if (!value) return "-";

    if (value === user?.id || value === user?.user_id) {
      return user?.name || user?.email || "Current User";
    }

    return value;
  };

  const exportReturnsCsv = () => {
    const rows = filteredReturns.map((item: any) => ({
      "Return No": item.return_number || "",
      Type: item.return_type || "",
      Supplier: item.supplier_name || "",
      Product: item.product_name || "",
      SKU: item.sku || "",
      Qty: item.qty || 0,
      Status: item.status || "",
      Reason: item.reason || "",
      Created: item.created_at
        ? new Date(item.created_at).toLocaleString("id-ID")
        : "",
      Approved: item.approved_at
        ? new Date(item.approved_at).toLocaleString("id-ID")
        : "",
      Rejected: item.rejected_at
        ? new Date(item.rejected_at).toLocaleString("id-ID")
        : "",
      Completed: item.completed_at
        ? new Date(item.completed_at).toLocaleString("id-ID")
        : "",
    }));

    if (rows.length === 0) {
      toast.error("Tidak ada data untuk export");
      return;
    }

    const headers = Object.keys(rows[0]);

    const csv = [
      headers.join(","),
      ...rows.map((row: any) =>
        headers
          .map((header) => {
            const value = String(row[header] ?? "");
            return `"${value.replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `returns-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(url);

    toast.success("CSV berhasil diexport");
  };

  const exportReturnsExcel = () => {
    const rows = filteredReturns.map((item: any) => ({
      "Return No": item.return_number || "",
      Type: item.return_type || "",
      Supplier: item.supplier_name || "",
      Product: item.product_name || "",
      SKU: item.sku || "",
      Qty: item.qty || 0,
      Status: item.status || "",
      Reason: item.reason || "",
      Created: item.created_at
        ? new Date(item.created_at).toLocaleString("id-ID")
        : "",
      Approved: item.approved_at
        ? new Date(item.approved_at).toLocaleString("id-ID")
        : "",
      Rejected: item.rejected_at
        ? new Date(item.rejected_at).toLocaleString("id-ID")
        : "",
      Completed: item.completed_at
        ? new Date(item.completed_at).toLocaleString("id-ID")
        : "",
    }));

    if (rows.length === 0) {
      toast.error("Tidak ada data untuk export");
      return;
    }

    const headers = Object.keys(rows[0]);

    const table = `
      <table>
        <thead>
          <tr>
            ${headers.map((header) => `<th>${header}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row: any) => `
                <tr>
                  ${headers
                    .map((header) => `<td>${String(row[header] ?? "")}</td>`)
                    .join("")}
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    `;

    const blob = new Blob([table], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `returns-${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();

    URL.revokeObjectURL(url);

    toast.success("Excel berhasil diexport");
  };

  const escapeHtml = (value: any) => {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const exportReturnsPdf = () => {
    if (filteredReturns.length === 0) {
      toast.error("Tidak ada data untuk export PDF");
      return;
    }

    const generatedAt = new Date().toLocaleString("id-ID");
    const generatedBy = user?.name || user?.email || "System";

    const tenantName =
      storedUser?.tenantName ||
      storedUser?.tenant ||
      "Tokoa";

    const selectedPeriod = "Last 30 Days";

    const rowsHtml = filteredReturns
      .map((item: any) => {
        return `
          <tr>
            <td>${escapeHtml(item.return_number)}</td>
            <td>${escapeHtml(item.return_type)}</td>
            <td>${escapeHtml(item.supplier_name || "-")}</td>
            <td>${escapeHtml(item.product_name)}</td>
            <td>${escapeHtml(item.sku)}</td>
            <td>${escapeHtml(item.qty)}</td>
            <td>
              <span
                style="
                  padding:4px 10px;
                  border-radius:999px;
                  color:white;
                  background:${
                    item.status === "COMPLETED"
                      ? "#16a34a"
                      : item.status === "APPROVED"
                      ? "#2563eb"
                      : item.status === "PENDING"
                      ? "#f59e0b"
                      : "#dc2626"
                  };
                "
              >
                ${escapeHtml(item.status)}
              </span>
            </td>
            <td>${escapeHtml(item.reason || "-")}</td>
            <td>${
              item.created_at
                ? escapeHtml(new Date(item.created_at).toLocaleString("id-ID"))
                : "-"
            }</td>
          </tr>
        `;
      })
      .join("");

    const reasonsHtml = returnReasonStats
      .map((item: any, index: number) => {
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.reason)}</td>
            <td>${escapeHtml(item.count)}</td>
          </tr>
        `;
      })
      .join("");

    const filterText = [
      returnSearch ? `Search: ${returnSearch}` : "Search: -",
      `Type: ${returnTypeFilter}`,
      `Status: ${returnStatusFilter}`,
    ].join(" | ");

    const html = `
      <!doctype html>
      <html>
        <head>
          <title>Return Report</title>
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              color: #111827;
              margin: 32px;
            }

            .footer {
              position: fixed;
              bottom: 10mm;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 10px;
              color: #6b7280;
            }

            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #111827;
              padding-bottom: 16px;
              margin-bottom: 20px;
            }

            h1 {
              margin: 0;
              font-size: 24px;
            }

            .subtitle {
              margin-top: 6px;
              color: #6b7280;
              font-size: 12px;
            }

            .meta {
              text-align: right;
              font-size: 12px;
              color: #374151;
              line-height: 1.6;
            }

            .signature {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              gap: 60px;
              font-size: 12px;
            }

            .summary {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              margin: 20px 0;
            }

            .card {
              border: 1px solid #d1d5db;
              border-radius: 10px;
              padding: 12px;
            }

            .card-label {
              font-size: 11px;
              color: #6b7280;
              margin-bottom: 8px;
            }

            .card-value {
              font-size: 22px;
              font-weight: 700;
            }

            .section {
              margin-top: 22px;
            }

            .section h2 {
              font-size: 16px;
              margin: 0 0 10px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }

            th {
              background: #f3f4f6;
              text-align: left;
              border: 1px solid #d1d5db;
              padding: 8px;
            }

            td {
              border: 1px solid #d1d5db;
              padding: 8px;
              vertical-align: top;
            }

            .filter {
              border: 1px solid #d1d5db;
              background: #f9fafb;
              border-radius: 10px;
              padding: 10px;
              font-size: 12px;
              color: #374151;
            }

            @media print {
              body {
                margin: 18mm;
              }

              .no-print {
                display: none;
              }

              table {
                page-break-inside: auto;
              }

            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
          }
        </style>
      </head>

      <body>
        <div class="header-left">
          <img src="logo.png" height="40" />
          <div>
            <h1>${tenantName} - Return Center Report</h1>
            <div class="subtitle">
              Customer & Supplier Returns Report
            </div>
          </div>
        </div>
        
        <div class="meta">
           <div><strong>Report No:</strong>&nbsp;RPT-RET-${new Date().toISOString().slice(0,10).replaceAll("-","")}-${Math.floor(Math.random()*1000)}</div>
          <div><strong>Generated At:</strong> ${generatedAt}</div>
          <div><strong>Generated By:</strong> ${generatedBy}</div>
        </div>
      </div>

        <div class="filter">
          <div>
            <strong>Active Filter:</strong>
            ${escapeHtml(filterText)}
          </div>

          <div style="margin-top:8px">
            <strong>Period:</strong>
            ${selectedPeriod}
          </div>
        </div>

        <div class="summary">
          <div class="card">
            <div class="card-label">Total Returns</div>
            <div class="card-value">${returnStats.total}</div>
          </div>
          <div class="card">
            <div class="card-label">Pending</div>
            <div class="card-value">${returnStats.pending}</div>
          </div>
          <div class="card">
            <div class="card-label">Approved</div>
            <div class="card-value">${returnStats.approved}</div>
          </div>
          <div class="card">
            <div class="card-label">Completed</div>
            <div class="card-value">${returnStats.completed}</div>
          </div>
          <div class="card">
            <div class="card-label">Customer Returns</div>
            <div class="card-value">${returnStats.customerReturns}</div>
          </div>
          <div class="card">
            <div class="card-label">Supplier Returns</div>
            <div class="card-value">${returnStats.supplierReturns}</div>
          </div>
          <div class="card">
            <div class="card-label">Qty Returned</div>
            <div class="card-value">${returnStats.qtyReturned}</div>
          </div>
          <div class="card">
            <div class="card-label">Qty Sent Back</div>
            <div class="card-value">${returnStats.qtySentBack}</div>
          </div>
        </div>

        <div class="section">
          <h2>Audit Summary</h2>

          <ul style="margin:12px 0; padding-left:20px; line-height:1.8; font-size:13px;">
            <li>Total Return : ${returnStats.total}</li>
            <li>Customer Return : ${returnStats.customerReturns}</li>
            <li>Supplier Return : ${returnStats.supplierReturns}</li>
            <li>Most Common Reason :
              ${returnReasonStats[0]?.reason || "-"}
            </li>
          </ul>
        </div>
        <h2>Top Return Reasons</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">Rank</th>
                <th>Reason</th>
                <th style="width: 90px;">Count</th>
              </tr>
            </thead>
            <tbody>
              ${
                reasonsHtml ||
                `<tr><td colspan="3">Belum ada data alasan return.</td></tr>`
              }
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Return Data</h2>
          <table>
            <thead>
              <tr>
                <th>Return No</th>
                <th>Type</th>
                <th>Supplier</th>
                <th>Product</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        <div class="footer">
          Generated by TRIZLAB WMS • ${generatedAt}
        </div>
        
        <div class="signature">
          <div>
            Prepared By<br /><br />
            ____________________
          </div>

          <div>
            Approved By<br /><br />
            ____________________
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      toast.error("Popup diblokir browser");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    toast.success("PDF report siap dicetak");
  };

  const handleAiAction = (actionType?: string) => {
    if (actionType === "SUPPLIER") setActiveTab("supplierScore");
    else if (actionType === "LEAD_TIME") setActiveTab("leadTime");
    else if (actionType === "FORECAST") setActiveTab("forecastAi");
    else if (actionType === "EXECUTIVE") setActiveTab("executive");
    else if (actionType === "REORDER") setActiveTab("reorder");
    else if (actionType === "RESTOCK_QUEUE") setActiveTab("restockQueue");
    else if (actionType === "PURCHASE_REQUEST") setActiveTab("purchaseRequest");
    else if (actionType === "PURCHASE_ORDER") setActiveTab("purchaseOrder");
  };

  const getMissionStatusClass = (status?: string) => {
    const value = String(status || "").toUpperCase();

    if (value === "CRITICAL") return "bg-red-100 text-red-700 border-red-200";
    if (value === "WARNING") return "bg-yellow-100 text-yellow-700 border-yellow-200";
    if (value === "GOOD") return "bg-green-100 text-green-700 border-green-200";

    return "bg-blue-100 text-blue-700 border-blue-200";
  };

  const getAutonomousStatusClass = (status?: string) => {
    const value = String(status || "").toUpperCase();

    if (value === "CRITICAL") return "bg-red-100 text-red-700 border-red-200";
    if (value === "WARNING") return "bg-yellow-100 text-yellow-700 border-yellow-200";
    if (value === "HEALTHY") return "bg-green-100 text-green-700 border-green-200";
    if (value === "SUPPLIER_CONFIRMED") return "bg-green-100 text-green-700 border-green-200";
    if (value === "PARTIAL_CONFIRMED") return "bg-orange-100 text-orange-700 border-orange-200";
    if (value === "REJECTED_BY_SUPPLIER") return "bg-red-100 text-red-700 border-red-200";

    return "bg-blue-100 text-blue-700 border-blue-200";
  };

  const loadAutonomousReports = async () => {
    try {
      setAutonomousLoading(true);

      const res =
        await inventoryApi.autonomousOperations.getReports({
          limit: 10,
        });

      setAutonomousReports(res.data.data || []);
    } finally {
      setAutonomousLoading(false);
    }
  };

  const runAutonomousScan = async () => {
    try {
      setRunningAutonomous(true);

      await inventoryApi.autonomousOperations.run();

      await loadAutonomousReports();

      toast.success("Autonomous scan completed");
    } catch (err) {
      toast.error("Autonomous scan failed");
    } finally {
      setRunningAutonomous(false);
    }
  };

  const actionTitles: Record<string, string> = {
    CREATE_RESTOCK_DRAFT: "Restock Draft Created",
    SKIP_RESTOCK_DRAFT: "Restock Draft Skipped",
    CREATE_PURCHASE_REQUEST: "Purchase Request Created",
    SKIP_PURCHASE_REQUEST: "Purchase Request Skipped",
    CREATE_PURCHASE_ORDER: "Purchase Order Created",
    SKIP_PURCHASE_ORDER: "Purchase Order Skipped",
    REVIEW_SUPPLIER: "Supplier Performance Review",
    SEND_WHATSAPP_PO: "WhatsApp PO Sent",
    SKIP_WHATSAPP_PO: "WhatsApp PO Skipped",
    SUPPLIER_CONFIRMED: "Supplier Confirmed",
    SUPPLIER_PARTIAL_CONFIRMED: "Supplier Partial Confirmation",
    SUPPLIER_REJECTED: "Supplier Rejected",
    FOLLOW_UP_SUPPLIER: "Supplier Follow Up",
    CREATE_GOODS_RECEIPT: "Goods Receipt Created",
    SKIP_GOODS_RECEIPT: "Goods Receipt Skipped",
  };

  const statusLabels: Record<string, string> = {
    SUCCESS: "Completed",
    SKIPPED: "Skipped",
    FAILED: "Failed",
  };

  return (
    <div className="space-y-6">
      <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              Stock Operations Center
            </h1>
          </div>
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab("executive")}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                activeTab === "executive"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              Executive KPI
            </button>

            <button
              onClick={() => setActiveTab("supplierScore")}
              className={`rounded-xl px-5 py-2 text-sm font-medium transition
                ${
                  activeTab === "supplierScore"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 hover:bg-slate-200"
               }`}
              >
              Supplier Score
            </button>

            <button
              onClick={() => setActiveTab("leadTime")}
              className={`rounded-xl px-5 py-2 text-sm font-medium transition ${
                activeTab === "leadTime"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Lead Time AI
            </button>

            <button
              onClick={() => setActiveTab("forecastAi")}
              className={`rounded-xl px-5 py-2 text-sm font-medium transition ${
                activeTab === "forecastAi"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Forecast AI v2
            </button>

            <button
              onClick={() => setActiveTab("inventory")}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                activeTab === "inventory"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              Current Stock
            </button>
          
            <button
              onClick={() => setActiveTab("movements")}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                activeTab === "movements"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              Stock Movement
            </button>

            <button
              onClick={() => setActiveTab("lowStock")}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                activeTab === "lowStock"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700"
               }`}
            >
              Low Stock
            </button>

            <button
              onClick={() => setActiveTab("reorder")}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                activeTab === "reorder"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700"
               }`}
            >
              Reorder
            </button>

            <button
              onClick={() => setActiveTab("restockQueue")}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                activeTab === "restockQueue"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700"
               }`}
            >
              Restock Queue
            </button>

            <button
              onClick={() => setActiveTab("purchaseRequest")}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                activeTab === "purchaseRequest"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              Purchase Request
            </button>

            <button
              onClick={() => setActiveTab("purchaseOrder")}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                activeTab === "purchaseOrder"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700"
             }`}
            >
              Purchase Order
            </button>

            <button
              onClick={() => setActiveTab("suppliers")}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                activeTab === "suppliers"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700"
              }`}
            >
              Suppliers
            </button>

            <Can permission="returns.view">
              <button
                onClick={() => setActiveTab("returns")}
                className={`rounded-xl px-4 py-2 text-sm font-medium ${
                  activeTab === "returns"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                Return Center
              </button>
            </Can>

            <button
              onClick={() => setActiveTab("autoRules")}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                activeTab === "autoRules"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700"
              }`}
            >
              Auto Rules
            </button>
            
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              {isFetching ||
              loadingAiSummary ||
              loadingMovements ||
              loadingExecutiveDashboard ||
              loadingSupplierPerformance ||
              loadingLeadTime || 
              loadingForecastAi ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              Refresh
            </button>
        </div>
      </div>

        {activeTab === "inventory" && (
          <div className="relative mt-6">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk, SKU, atau nama..."
              className="w-full rounded-2xl border border-zinc-300 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-zinc-900"
            />
          </div>
        )}
      </div>

{aiSummary && (
  <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 shadow-sm">
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
      <div className="max-w-3xl">
        <div className="flex items-center gap-3">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-2xl shadow-sm">
            🤖
            <span className="absolute -right-1 -bottom-1 h-4 w-4 rounded-full border-2 border-white bg-green-500" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-black text-zinc-900">
                TRIZLABHW AI COO
              </span>

              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Online
                </span>
              </div>

              <p className="mt-0.5 text-xs font-medium text-zinc-500">
                Operations Analyst • Inventory, Forecast, Supplier & Lead Time
              </p>
           </div>
        </div>

        <h2 className="mt-4 text-2xl font-bold text-zinc-900">
          {aiSummary?.aiCooBriefing?.greeting || "Good day Admin 👋"}
        </h2>

        <p className="mt-2 text-lg font-semibold text-zinc-800">
          {aiSummary?.aiCooBriefing?.headline}
        </p>

        <div className="mt-4 space-y-2 text-sm leading-6 text-zinc-700">
          {(aiSummary?.aiCooBriefing?.paragraphs || []).map((text: string) => (
            <p key={text}>{text}</p>
          ))}
        </div>

        <p className="mt-4 rounded-2xl border border-blue-100 bg-white/70 px-4 py-3 text-sm font-medium text-blue-800">
          {aiSummary?.aiCooBriefing?.closing}
        </p>
      </div>

      <div className="min-w-[220px] rounded-3xl border border-white bg-white p-5 shadow-sm">
        <p className="text-sm text-zinc-500">Inventory Health</p>

        <div className="mt-2 flex items-end gap-2">
          <span className="text-5xl font-black text-zinc-900">
            {aiSummary?.healthScore || 0}
          </span>
          <span className="pb-2 text-sm text-zinc-500">/100</span>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${
              Number(aiSummary?.healthScore || 0) >= 95
                ? "bg-green-500"
                : Number(aiSummary?.healthScore || 0) >= 80
                ? "bg-blue-500"
                : Number(aiSummary?.healthScore || 0) >= 60
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${Math.min(100, Number(aiSummary?.healthScore || 0))}%` }}
          />
        </div>

        <div className="mt-4 inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
          {aiSummary?.healthStatus}
        </div>
      </div>
    </div>

    <div className="mt-6 grid gap-4 lg:grid-cols-4">
      <div className="rounded-2xl border border-red-100 bg-white/80 p-4">
        <p className="font-semibold text-red-700">🔴 Critical</p>
        <p className="mt-2 text-2xl font-bold">{aiSummary?.summary?.criticalCount || 0}</p>
        <p className="mt-1 text-xs text-zinc-500">
          {aiSummary?.critical?.[0]?.message || "Tidak ada critical issue."}
        </p>
      </div>

      <div className="rounded-2xl border border-yellow-100 bg-white/80 p-4">
        <p className="font-semibold text-yellow-700">🟡 Warning</p>
        <p className="mt-2 text-2xl font-bold">{aiSummary?.summary?.warningCount || 0}</p>
        <p className="mt-1 text-xs text-zinc-500">
          {aiSummary?.warnings?.[0]?.message || "Tidak ada warning utama."}
        </p>
      </div>

      <div className="rounded-2xl border border-green-100 bg-white/80 p-4">
        <p className="font-semibold text-green-700">🟢 Information</p>
        <p className="mt-2 text-2xl font-bold">{aiSummary?.summary?.informationCount || 0}</p>
        <p className="mt-1 text-xs text-zinc-500">
          {aiSummary?.information?.[0]?.message || "Belum ada insight tambahan."}
        </p>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-white/80 p-4">
        <p className="font-semibold text-blue-700">💡 Recommendation</p>
        <p className="mt-2 text-2xl font-bold">{aiSummary?.summary?.recommendationCount || 0}</p>
        <p className="mt-1 text-xs text-zinc-500">
          {aiSummary?.recommendations?.[0]?.message || "Tidak ada rekomendasi pembelian."}
        </p>
      </div>
    </div>

    <div className="mt-5 flex flex-wrap gap-2">
      {aiSummary?.quickActions?.viewForecast && (
        <button
          onClick={() => setActiveTab("forecastAi")}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Open Forecast AI
        </button>
      )}

      {aiSummary?.quickActions?.viewSupplier && (
        <button
          onClick={() => setActiveTab("supplierScore")}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          View Supplier Score
        </button>
      )}

      {aiSummary?.quickActions?.viewLeadTime && (
        <button
          onClick={() => setActiveTab("leadTime")}
          className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
        >
          Check Lead Time
        </button>
      )}
    </div>
  </div>
)}

<div className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm">
  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <p className="text-sm font-black text-indigo-700">
        🛰 Autonomous Operations
      </p>
      <h3 className="mt-1 text-xl font-bold text-zinc-900">
        AI Operations Scan
      </h3>
      <p className="mt-1 text-sm text-zinc-500">
        History scan otomatis inventory, supplier, forecast, dan lead time.
      </p>
    </div>

    <button
      onClick={runAutonomousScan}
      disabled={runningAutonomous}
      className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
    >
      {runningAutonomous ? "Running..." : "Run Scan"}
    </button>
  </div>

  <div className="mt-5 space-y-3">
    {autonomousLoading && (
      <p className="text-sm text-zinc-500">Loading autonomous reports...</p>
    )}

    {!autonomousLoading && autonomousReports.length === 0 && (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
        Belum ada autonomous report.
      </div>
    )}

    {autonomousReports.map((report: any) => (
      <div
        key={report.id}
        onClick={async () => {
          const res = await inventoryApi.autonomousOperations.getReport(report.id);
          setSelectedAutonomousReport(res.data.data);
        }}
        className="cursor-pointer rounded-2xl border border-zinc-200 bg-zinc-50 p-4 hover:border-indigo-200 hover:bg-indigo-50"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-zinc-900">
              {report.operationStatus}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {report.createdAt
                ? new Date(report.createdAt).toLocaleString("id-ID")
                : "-"}
            </p>
          </div>

          <div className="rounded-xl bg-white px-3 py-2 text-right text-xs font-bold text-zinc-700">
            Critical {report.criticalCount || 0} · Warning {report.warningCount || 0}
          </div>
        </div>

        <p className="mt-3 text-sm text-zinc-600">
          {report.summary}
        </p>
      </div>
    ))}
  </div>
</div>

{aiSummary?.aiCooV2 && (
  <div className="mt-6 grid gap-4 xl:grid-cols-5">
    <div className="rounded-2xl border border-yellow-100 bg-white/80 p-4">
      <p className="text-sm font-semibold text-yellow-700">⭐ Today's Priority</p>
      <h3 className="mt-2 font-bold text-zinc-900">
        {aiSummary.aiCooV2.todayPriority?.title}
      </h3>
      <p className="mt-1 text-xs text-zinc-500">
        {aiSummary.aiCooV2.todayPriority?.description}
      </p>
      <p className="mt-3 text-xs font-semibold text-zinc-700">
        Est. {aiSummary.aiCooV2.todayPriority?.estimatedMinutes || 0} minutes
      </p>
      <button
        onClick={() => handleAiAction(aiSummary.aiCooV2.todayPriority?.actionType)}
        className="mt-3 rounded-xl bg-yellow-500 px-3 py-2 text-xs font-bold text-white hover:bg-yellow-600"
      >
        {aiSummary.aiCooV2.todayPriority?.buttonLabel || "Open"}
      </button>
    </div>

    <div className="rounded-2xl border border-blue-100 bg-white/80 p-4">
      <p className="text-sm font-semibold text-blue-700">🧠 AI Confidence</p>
      <div className="mt-2 text-3xl font-black">
        {aiSummary.aiCooV2.aiConfidence?.score || 0}%
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600"
          style={{ width: `${aiSummary.aiCooV2.aiConfidence?.score || 0}%` }}
        />
      </div>
      <p className="mt-2 text-xs font-bold text-blue-700">
        {aiSummary.aiCooV2.aiConfidence?.status}
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        {aiSummary.aiCooV2.aiConfidence?.note}
      </p>
    </div>

    <div className="rounded-2xl border border-green-100 bg-white/80 p-4">
      <p className="text-sm font-semibold text-green-700">💰 Business Opportunity</p>
      <h3 className="mt-2 font-bold text-zinc-900">
        {aiSummary.aiCooV2.businessOpportunity?.title}
      </h3>
      <p className="mt-1 text-xs text-zinc-500">
        {aiSummary.aiCooV2.businessOpportunity?.description}
      </p>
      <p className="mt-3 text-2xl font-black text-green-700">
        {aiSummary.aiCooV2.businessOpportunity?.valueLabel}
      </p>
    </div>

    <div className="rounded-2xl border border-indigo-100 bg-white/80 p-4">
      <p className="text-sm font-semibold text-indigo-700">📅 Next 7 Days</p>
      <div className="mt-3 space-y-3">
        {(aiSummary.aiCooV2.timeline || []).slice(0, 4).map((item: any) => (
          <div key={`${item.day}-${item.title}`} className="border-l-2 border-indigo-200 pl-3">
            <p className="text-xs font-bold text-indigo-700">{item.day}</p>
            <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
            <p className="text-xs text-zinc-500">{item.description}</p>
          </div>
        ))}
      </div>
    </div>

    <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4">
      <p className="text-sm font-semibold text-zinc-800">🎯 AI Suggested Actions</p>
      <div className="mt-3 space-y-2">
        {(aiSummary.aiCooV2.suggestedActions || []).map((action: any) => (
          <button
            key={`${action.priority}-${action.title}`}
            onClick={() => handleAiAction(action.actionType)}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-left text-xs hover:bg-zinc-50"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold">
                {action.priority}. {action.title}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold">
                {action.level}
              </span>
            </div>
            <p className="mt-1 text-zinc-500">{action.description}</p>
          </button>
        ))}
      </div>
    </div>
  </div>
)}

{aiSummary?.missionControl && (
  <div className="mt-6 rounded-3xl border border-indigo-100 bg-white/90 p-5 shadow-sm">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-700">
          🧭 AI Mission Control
        </p>
        <h3 className="mt-3 text-2xl font-bold text-zinc-900">
          {aiSummary.missionControl.todayMission?.title}
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          {aiSummary.missionControl.todayMission?.description}
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4">
        <p className="text-xs text-zinc-500">Mission Progress</p>
        <p className="mt-1 text-3xl font-black text-zinc-900">
          {aiSummary.missionControl.progressToday?.percent || 0}%
        </p>
      </div>
    </div>

    <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-indigo-600"
        style={{
          width: `${aiSummary.missionControl.progressToday?.percent || 0}%`,
        }}
      />
    </div>

    <div className="mt-5 grid gap-4 lg:grid-cols-3">
      <div className="rounded-2xl border border-zinc-200 p-4">
        <p className="font-semibold text-zinc-900">Today's Mission</p>
        <p className="mt-2 text-sm text-zinc-500">
          Priority:{" "}
          <span className="font-bold text-zinc-900">
            {aiSummary.missionControl.todayMission?.priority}
          </span>
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Estimated:{" "}
          <span className="font-bold text-zinc-900">
            {aiSummary.missionControl.todayMission?.estimatedMinutes || 0} minutes
          </span>
        </p>
        <button
          onClick={() =>
            handleAiAction(aiSummary.missionControl.todayMission?.actionType)
          }
          className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
        >
          {aiSummary.missionControl.todayMission?.buttonLabel || "Open"}
        </button>
      </div>

      <div className="rounded-2xl border border-zinc-200 p-4">
        <p className="font-semibold text-zinc-900">Task Checklist</p>

        <div className="mt-3 space-y-2">
          {(aiSummary.missionControl.progressToday?.tasks || []).map((task: any) => (
            <div
              key={task.key}
              className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
            >
              <span>{task.title}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  task.completed
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {task.completed ? "Done" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 p-4">
        <p className="font-semibold text-zinc-900">Business Impact</p>
        <p className="mt-3 text-3xl font-black text-green-700">
          {aiSummary.missionControl.businessImpact?.label || "Rp 0"}
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          {aiSummary.missionControl.businessImpact?.description}
        </p>

        <p className="mt-4 text-xs font-semibold text-zinc-500">Health Trend</p>

        <div className="mt-3 rounded-2xl bg-slate-50 p-3">
          <div className="space-y-2">
            {(aiSummary.missionControl.healthTrend || []).map((value: number, index: number) => {
              const trend = aiSummary.missionControl.healthTrend || [];
              const minValue = Math.min(...trend);
              const maxValue = Math.max(...trend);
              const range = Math.max(1, maxValue - minValue);
              const width = 30 + ((Number(value) - minValue) / range) * 70;

              return (
              <div key={`${value}-${index}`} className="flex items-center gap-2">
                <span className="w-7 text-[10px] font-bold text-zinc-500">
                  {value}
                </span>

                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-green-500"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-xs font-semibold text-green-700">
          ↗ +
          {Math.max(
            0,
            Number((aiSummary.missionControl.healthTrend || []).at?.(-1) || 0) -
              Number((aiSummary.missionControl.healthTrend || [])[0] || 0)
          )}{" "}
          pts trend
        </p>
       </div>
      </div>
    </div>

    <div className="mt-5 rounded-2xl border border-zinc-200 p-4">
      <p className="font-semibold text-zinc-900">Mission Timeline</p>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        {(aiSummary.missionControl.timeline || []).map((item: any) => (
          <div
            key={`${item.time}-${item.title}`}
            className="rounded-2xl border border-zinc-200 bg-white p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-zinc-500">{item.time}</p>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getMissionStatusClass(
                  item.status
                )}`}
              >
                {item.status}
              </span>
            </div>
            <p className="mt-2 font-semibold text-zinc-900">{item.title}</p>
            <p className="mt-1 text-xs text-zinc-500">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
)}

{activeTab === "executive" && (
  <div className="space-y-6">
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">
            Executive Dashboard & KPI
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Ringkasan performa inventory, procurement, sales, dan supplier.
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-sm text-blue-600">Critical Forecast</p>
          <p className="text-3xl font-bold text-blue-700">
            {Number(executiveDashboard?.inventory?.criticalForecastCount || 0)}
          </p>
        </div>
      </div>

      {loadingExecutiveDashboard ? (
        <div className="py-16 text-center text-zinc-500">
          Memuat Executive KPI...
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Total Products",
                value: executiveDashboard?.inventory?.totalProducts || 0,
                hint: "Produk aktif",
              },
              {
                label: "Low Stock",
                value: executiveDashboard?.inventory?.lowStockCount || 0,
                hint: "Butuh perhatian",
              },
              {
                label: "Stock Qty",
                value: executiveDashboard?.inventory?.totalStockQty || 0,
                hint: "Total stok saat ini",
              },
              {
                label: "Revenue 30d",
                value: `Rp ${Number(
                  executiveDashboard?.sales?.revenue30d || 0
                ).toLocaleString("id-ID")}`,
                hint: `${Number(executiveDashboard?.sales?.orders30d || 0)} order`,
              },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm text-zinc-500">{card.label}</p>
                <p className="mt-2 text-3xl font-bold text-zinc-900">
                  {card.value}
                </p>
                <p className="mt-1 text-xs text-zinc-500">{card.hint}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-3xl border border-zinc-200 p-5">
              <h3 className="font-semibold text-zinc-900">Procurement</h3>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Draft PR</span>
                  <strong>{executiveDashboard?.procurement?.draftPr || 0}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Approved PR</span>
                  <strong>{executiveDashboard?.procurement?.approvedPr || 0}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Approved Restock</span>
                  <strong>{executiveDashboard?.procurement?.approvedRestock || 0}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Rejected Supplier</span>
                  <strong className="text-red-600">
                    {executiveDashboard?.procurement?.rejectedBySupplier || 0}
                  </strong>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 p-5">
              <h3 className="font-semibold text-zinc-900">Supplier Confirmation</h3>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Ready</span>
                  <strong className="text-green-600">
                    {executiveDashboard?.supplier?.ready || 0}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Partial</span>
                  <strong className="text-yellow-600">
                    {executiveDashboard?.supplier?.partial || 0}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">ETA</span>
                  <strong className="text-blue-600">
                    {executiveDashboard?.supplier?.eta || 0}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Rejected / Out</span>
                  <strong className="text-red-600">
                    {Number(executiveDashboard?.supplier?.rejected || 0) +
                      Number(executiveDashboard?.supplier?.outOfStock || 0)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 p-5">
              <h3 className="font-semibold text-zinc-900">Risk Snapshot</h3>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Low Stock</span>
                  <strong>{executiveDashboard?.inventory?.lowStockCount || 0}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Out of Stock</span>
                  <strong className="text-red-600">
                    {executiveDashboard?.inventory?.outOfStockCount || 0}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Critical Forecast</span>
                  <strong className="text-orange-600">
                    {executiveDashboard?.inventory?.criticalForecastCount || 0}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Open PO</span>
                  <strong>{executiveDashboard?.procurement?.openPo || 0}</strong>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  </div>
)}
      
{activeTab === "supplierScore" && (
  <div className="space-y-6">
    <div className="rounded-3xl border bg-white p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold">
            Supplier Performance Score
          </h2>
          <p className="text-slate-500">
            Evaluasi performa supplier berdasarkan konfirmasi Purchase Order.
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-zinc-600">
              <th className="w-[24%] py-3 text-left">Supplier</th>
              <th className="w-[12%] py-3 text-center">Total PO</th>
              <th className="w-[12%] py-3 text-center">Ready %</th>
              <th className="w-[12%] py-3 text-center">Reject %</th>
              <th className="w-[12%] py-3 text-center">Score</th>
              <th className="w-[12%] py-3 text-center">Grade</th>
            </tr>
          </thead>

          <tbody>
            {supplierPerformance.map((row: any) => (
              <tr key={`${row.supplierName}-${row.supplierPhone}`} className="border-b">
                <td className="py-4 pr-4 align-middle">
                  <div className="font-medium text-zinc-900">{row.supplierName}</div>
                  <div className="text-xs text-slate-500">{row.supplierPhone || "-"}</div>
                </td>

                <td className="py-4 text-center align-middle">{row.totalPo}</td>
                <td className="py-4 text-center align-middle">{row.readyRate}%</td>
                <td className="py-4 text-center align-middle">{row.rejectRate}%</td>

                <td className="py-4 text-center align-middle font-bold">
                  {row.score}
                </td>

                <td className="py-4 text-center align-middle">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      row.grade === "A"
                        ? "bg-green-100 text-green-700"
                        : row.grade === "B"
                        ? "bg-blue-100 text-blue-700"
                        : row.grade === "C"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {row.grade}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}

      {activeTab === "leadTime" && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-6">
            <h2 className="text-3xl font-bold">
              Lead Time Prediction AI
            </h2>
            <p className="text-slate-500 mt-2">
              Prediksi ETA Purchase Order berdasarkan histori supplier.
            </p>
              <div className="grid grid-cols-4 gap-4 mt-6">
                <div className="rounded-xl border p-5">
                <div className="text-sm text-slate-500">
                  Open PO
                </div>
              <div className="text-3xl font-bold">
                 {leadTimeSummary?.openPoCount || 0}
              </div>
            </div>

              <div className="rounded-xl border p-5">
                <div className="text-sm text-slate-500">
                  Overdue
                </div>
              <div className="text-3xl font-bold text-red-600">
                {leadTimeSummary?.overdueCount || 0}
              </div>
            </div>

              <div className="rounded-xl border p-5">
                <div className="text-sm text-slate-500">
              Due Soon
              </div>
              <div className="text-3xl font-bold text-orange-500">
                {leadTimeSummary?.dueSoonCount || 0}
              </div>
              </div>

              <div className="rounded-xl border p-5">
                <div className="text-sm text-slate-500">
                  No History
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {leadTimeSummary?.noHistoryCount || 0}
                </div>
              </div>

            </div>
              <div className="mt-8 overflow-x-auto">
                <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 text-left">
                      PO
                    </th>
                   <th className="text-left">
                      Supplier
                    </th>
                    <th className="text-center">
                      Lead Time
                    </th>
                    <th className="text-center">
                      ETA
                    </th>
                    <th className="text-center"> 
                      Confidence
                    </th>
                    <th className="text-center">
                      Risk
                    </th>
                  </tr>
                </thead>
              <tbody>

            {leadTimePrediction.map((row:any)=>(
              <tr
                key={row.id}
                className="border-b"
              >
                <td className="py-4">
                  {row.poNumber}
                </td>
                <td>
                  <div>{row.supplierName}</div>
                  <div className="text-xs text-slate-500">
                    {row.supplierPhone}
                  </div>
                </td>
                  <td className="text-center">
                    {row.predictedLeadDays} hari
                  </td>
                  <td className="text-center">
                    {row.predictedArrivalDate}
                  </td>
                  <td className="text-center">
                    {row.confidence}%
                  </td>
                  <td className="text-center">
                  <span className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs">
                    {row.riskStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}

{activeTab === "forecastAi" && (
  <div className="space-y-6">
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-3xl font-bold text-zinc-900">
          Forecast AI v2
        </h2>
        <p className="mt-2 text-slate-500">
          Prediksi stok berbasis seasonality, pola hari penjualan, dan demand 30 hari ke depan.
        </p>
      </div>

      {loadingForecastAi ? (
        <div className="py-16 text-center text-zinc-500">
          Memuat Forecast AI v2...
        </div>
      ) : forecastAi.length === 0 ? (
        <div className="py-16 text-center text-zinc-500">
          Belum ada data forecast.
        </div>
      ) : (
        <div className="mt-6 grid gap-6">
          {forecastAi.map((item: any) => {
            const statusClass =
              item.forecastStatus === "SAFE"
                ? "bg-green-100 text-green-700"
                : item.forecastStatus === "WARNING"
                ? "bg-yellow-100 text-yellow-700"
                : item.forecastStatus === "CRITICAL"
                ? "bg-red-100 text-red-700"
                : "bg-slate-100 text-slate-700";

            const maxWeekday = Math.max(
              ...((item.weekdaySales || []).map((d: any) => Number(d.avgForWeekday || 0))),
              1
            );

            const hasSalesData = Number(item.soldQty || 0) > 0;

            const recommendations = hasSalesData
              ? [
                  item.predictedStockoutDate
                    ? `Safe until ${new Date(item.predictedStockoutDate).toLocaleDateString("id-ID")}`
                    : "Belum cukup data untuk prediksi stockout",
                  item.shouldReorder ? "Reorder recommended" : "No reorder needed",
                  item.peakDay ? `${item.peakDay} has highest demand` : "No peak day detected",
                  item.peakDay ? `Increase safety stock before ${item.peakDay}` : "Collect more sales data",
                ]
              : [
                  "Belum ada data penjualan untuk pola seasonality",
                  "Collect more sales data",
                  "No reorder needed",
                  "Forecast akan lebih akurat setelah ada transaksi",
                ];
                 
            return (
              <div
                key={item.productId}
                className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-sm text-zinc-500">Product</div>
                    <h3 className="mt-1 text-2xl font-bold text-zinc-900">
                      {item.productName}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-500">
                      SKU: {item.sku || "-"}
                    </p>
                  </div>

                  <span className={`rounded-full px-4 py-2 text-sm font-bold ${statusClass}`}>
                    {item.forecastStatus}
                  </span>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <div className="rounded-2xl border border-zinc-200 p-4">
                    <p className="text-sm text-zinc-500">Peak Day</p>
                    <p className="mt-2 text-2xl font-bold">{item.peakDay || "-"}</p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 p-4">
                    <p className="text-sm text-zinc-500">Seasonality</p>
                    <p className="mt-2 text-2xl font-bold">
                      {Number(item.seasonalityStrength || 0)}x
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 p-4">
                    <p className="text-sm text-zinc-500">Projected Demand</p>
                    <p className="mt-2 text-2xl font-bold">
                      {Number(item.projectedDemand || 0)} pcs
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 p-4">
                    <p className="text-sm text-zinc-500">Days Remaining</p>
                    <p className="mt-2 text-2xl font-bold">
                      {item.daysRemaining ?? "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 p-4">
                    <p className="text-sm text-zinc-500">Stockout</p>
                    <p className="mt-2 text-lg font-bold">
                      {item.predictedStockoutDate
                        ? new Date(item.predictedStockoutDate).toLocaleDateString("id-ID")
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div className="rounded-3xl border border-zinc-200 p-5">
                    <h4 className="font-semibold text-zinc-900">Weekly Pattern</h4>

                    <div className="mt-4 space-y-3">
                      {(item.weekdaySales || []).map((day: any) => {
                        const width = Math.max(
                          4,
                          Math.round((Number(day.avgForWeekday || 0) / maxWeekday) * 100)
                        );

                        return (
                          <div
                            key={day.dayName}
                            className="grid grid-cols-[90px_1fr_70px] items-center gap-3 text-sm"
                          >
                            <span className="text-zinc-600">{day.dayName}</span>
                            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-blue-600"
                                style={{ width: `${width}%` }}
                              />
                            </div>
                            <span className="text-right font-medium">
                              {Number(day.avgForWeekday || 0)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-zinc-200 p-5">
                    <h4 className="font-semibold text-zinc-900">Demand Next 30 Days</h4>

                    <div className="mt-4 h-64">
                      {Number(item.projectedDemand || 0) <= 0 ? (
                        <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-zinc-300 text-sm text-zinc-500">
                          Belum ada demand projection.
                        </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={(item.demandByDay || []).slice(0, 30)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(value) =>
                              new Date(value).toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "short",
                              })
                            }
                          />
                          <YAxis />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="projectedDemand"
                            stroke="#2563eb"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-5">
                  <h4 className="font-semibold text-blue-900">AI Recommendations</h4>

                  <div className="mt-3 grid gap-2 text-sm text-blue-900 md:grid-cols-2">
                    {recommendations.map((text) => (
                      <div key={text} className="flex gap-2">
                        <span>✓</span>
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
)}

      {activeTab === "inventory" && (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          {isLoading ? (
            <div className="py-20 text-center text-zinc-500">
              Memuat inventori...
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="py-20 text-center text-zinc-500">
              Belum ada data inventori.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-200">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">
                      Produk
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">
                      Stok Saat Ini
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">
                      Stok Tersedia
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">
                      Min. Stok
                    </th>
                    {canEditInventory && (
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">
                        Aksi
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100 bg-white">
                  {filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-4">
                        <div className="font-medium text-zinc-900">
                          {item.productName || "-"}
                        </div>
                        <div className="mt-1 text-sm text-zinc-500">
                          SKU: {item.sku || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-zinc-700">
                        {Number(item.stock || 0)}
                      </td>

                      <td className="px-4 py-4 text-sm text-zinc-700">
                        {Number(item.availableStock || 0)}
                      </td>

                      <td className="px-4 py-4 text-sm text-zinc-700">
                        {Number(item.minStockLevel || 0)}
                      </td>

                      {canEditInventory && (
                        <td className="px-4 py-4">
                          <button
                            onClick={() => openEdit(item)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                          >
                            <Edit3 className="h-4 w-4" />
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

 {activeTab === "lowStock" && (
  <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900">
          Low Stock Monitoring
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Pantau produk yang stoknya mendekati atau berada di bawah minimum.
        </p>
      </div>

      <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
        <p className="text-sm text-red-600">Butuh perhatian</p>
        <p className="text-2xl font-bold text-red-700">
          {lowStockItems.length}
        </p>
      </div>
    </div>

    <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-200">
      <table className="min-w-[900px] w-full text-sm">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left">Produk</th>
            <th className="px-4 py-3 text-left">SKU</th>
            <th className="px-4 py-3 text-left">Stock</th>
            <th className="px-4 py-3 text-left">Min Stock</th>
            <th className="px-4 py-3 text-left">Kekurangan</th>
            <th className="px-4 py-3 text-left">Status</th>
            {canEditInventory && (
              <th className="px-4 py-3 text-left">Aksi</th>
            )}
          </tr>
        </thead>

        <tbody>
          {lowStockItems.map((item) => (
            <tr key={item.id} className="border-t hover:bg-zinc-50">
              <td className="px-4 py-4 font-medium text-zinc-900">
                {item.productName || "-"}
              </td>

              <td className="px-4 py-4 text-zinc-600">
                {item.sku || "-"}
              </td>

              <td className="px-4 py-4 font-semibold text-zinc-900">
                {item.stock}
              </td>

              <td className="px-4 py-4 text-zinc-700">
                {item.minStock}
              </td>

              <td className={`px-4 py-4 font-semibold ${
                item.gap > 0
                  ? "text-red-600"
                  : "text-green-600"
               }`}
              >
                {item.gap}
              </td>

              <td className="px-4 py-4">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getLowStockStatusClass(
                    item.status
                  )}`}
                >
                  {getLowStockStatusLabel(item.status)}
                </span>
              </td>

              {canEditInventory && (
                <td className="px-4 py-4">
                  <button
                    onClick={() => openEdit(item)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    <Edit3 className="h-4 w-4" />
                    Update Stok
                  </button>
                </td>
              )}
            </tr>
          ))}

          {lowStockItems.length === 0 && (
            <tr>
              <td
                colSpan={canEditInventory ? 7 : 6}
                className="px-4 py-12 text-center text-zinc-500"
              >
                Semua stok masih aman.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)}

 {activeTab === "reorder" && (
  <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900">
          Reorder Recommendation
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Rekomendasi restock berdasarkan stok saat ini dan minimum stock.
        </p>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
        <p className="text-sm text-blue-600">Rekomendasi</p>
        <p className="text-2xl font-bold text-blue-700">
          {reorderRecommendations.length}
        </p>
      </div>
    </div>

    <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-200">
      <table className="min-w-[1000px] w-full text-sm">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left">Produk</th>
            <th className="px-4 py-3 text-left">SKU</th>
            <th className="px-4 py-3 text-left">Stock</th>
            <th className="px-4 py-3 text-left">Min Stock</th>
            <th className="px-4 py-3 text-left">Gap</th>
            <th className="px-4 py-3 text-left">Rekomendasi Restock</th>
            <th className="px-4 py-3 text-left">Alasan</th>
            {canEditInventory && (
              <th className="px-4 py-3 text-left">Aksi</th>
            )}
          </tr>
        </thead>

        <tbody>
          {reorderRecommendations.map((item) => (
            <tr key={item.id} className="border-t hover:bg-zinc-50">
              <td className="px-4 py-4 font-medium text-zinc-900">
                {item.productName || "-"}
              </td>

              <td className="px-4 py-4 text-zinc-600">
                {item.sku || "-"}
              </td>

              <td className="px-4 py-4 font-semibold text-zinc-900">
                {item.stock}
              </td>

              <td className="px-4 py-4 text-zinc-700">
                {item.minStock}
              </td>

              <td className="px-4 py-4 font-semibold text-red-600">
                {item.gap}
              </td>

              <td className="px-4 py-4">
                <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                  +{item.recommendedQty} pcs
                </span>
              </td>

              <td className="px-4 py-4 text-zinc-700">
                {item.status === "OUT_OF_STOCK"
                  ? "Stok habis, rekomendasi restock 2x minimum stock."
                  : item.status === "LOW_STOCK"
                  ? "Stok di bawah minimum, rekomendasi cover sampai minimum + buffer."
                  : "Stok tepat di batas minimum, perlu dipantau."}
              </td>

              {canEditInventory && (
                <td className="px-4 py-4">
                 <div className="flex flex-col gap-2">
                  <button
                    onClick={() => createRestockRequest(item)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Buat Restock
                  </button>

                  <button
                    onClick={() => openEdit(item)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    <Edit3 className="h-4 w-4" />
                    Update Stok
                 </button>
                </div>
              </td>
              )}
            </tr>
          ))}

          {reorderRecommendations.length === 0 && (
            <tr>
              <td
                colSpan={canEditInventory ? 8 : 7}
                className="px-4 py-12 text-center text-zinc-500"
              >
                Belum ada produk yang perlu reorder.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)}

{activeTab === "restockQueue" && (
  <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900">
          Restock Queue
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Daftar request restock dari rekomendasi reorder.
        </p>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
        <p className="text-sm text-blue-600">Pending</p>
        <p className="text-2xl font-bold text-blue-700">
          {
            restockRequests.filter((request) => request.status === "PENDING")
              .length
          }
        </p>
      </div>
    </div>

    <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-200">
      <table className="min-w-[1100px] w-full text-sm">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left">Produk</th>
            <th className="px-4 py-3 text-left">SKU</th>
            <th className="px-4 py-3 text-left">Stock</th>
            <th className="px-4 py-3 text-left">Min</th>
            <th className="px-4 py-3 text-left">Gap</th>
            <th className="px-4 py-3 text-left">Request Qty</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Reason</th>
            <th className="px-4 py-3 text-left">Aksi</th>
          </tr>
        </thead>

        <tbody>
          {restockRequests.map((request) => (
            <tr key={request.id} className="border-t hover:bg-zinc-50">
              <td className="px-4 py-4 font-medium text-zinc-900">
                {request.productName || request.product_name}
              </td>

              <td className="px-4 py-4 text-zinc-600">
                {request.sku}
              </td>

              <td className="px-4 py-4 font-semibold">
                {request.currentStock ?? request.current_stock}
              </td>

              <td className="px-4 py-4">{request.minStock ?? request.min_stock}</td>

              <td className="px-4 py-4 font-semibold text-red-600">
                {request.gap}
              </td>

              <td className="px-4 py-4">
                <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                  +{request.requestedQty ?? request.requested_qty} pcs
                </span>
              </td>

              <td className="px-4 py-4">
                <span className="inline-flex rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                  {request.status}
                </span>
              </td>

              <td className="max-w-[260px] truncate px-4 py-4" title={request.reason}>
                {request.reason}
              </td>

              <td className="px-4 py-4">
                <div className="flex gap-2">
                  {request.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => updateRestockStatus(request.id, "APPROVED")}
                        className="rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() => updateRestockStatus(request.id, "REJECTED")}
                        className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {request.status === "APPROVED" && (
                    <button
                      onClick={() => updateRestockStatus(request.id, "DONE")}
                      className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
                    >
                      Mark Done
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}

          {restockRequests.length === 0 && (
            <tr>
              <td colSpan={9} className="px-4 py-12 text-center text-zinc-500">
                Belum ada restock request.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)}

{activeTab === "purchaseRequest" && (
  <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-xl font-bold text-zinc-900">
          Purchase Request
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Daftar permintaan pembelian barang dari restock queue.
        </p>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
        <div className="text-sm text-blue-600">Total PR</div>
        <div className="text-3xl font-bold text-blue-700">
          {purchaseRequests.length}
        </div>
      </div>
    </div>

    <div className="overflow-x-auto rounded-2xl border border-zinc-200">
      <table className="min-w-[1000px] w-full text-sm">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left">PR Number</th>
            <th className="px-4 py-3 text-left">Product</th>
            <th className="px-4 py-3 text-left">SKU</th>
            <th className="px-4 py-3 text-left">Qty</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Tanggal</th>
            <th className="px-4 py-3 text-left">Aksi</th>
          </tr>
        </thead>

        <tbody>
          {purchaseRequests.map((item) => {
            const status = String(item.status || "").toUpperCase();

            return (
              <tr key={item.id} className="border-t hover:bg-zinc-50">
                <td className="px-4 py-4 font-mono text-xs font-semibold text-zinc-900">
                  {item.prNumber || item.pr_number}
                </td>

                <td className="px-4 py-4 font-medium text-zinc-900">
                  {item.productName || item.product_name}
                </td>

                <td className="px-4 py-4 text-zinc-600">
                  {item.sku || "-"}
                </td>

                <td className="px-4 py-4 font-semibold">
                  {item.qty}
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getPurchaseRequestStatusClass(
                      status
                    )}`}
                  >
                    {status}
                  </span>
                </td>

                <td className="px-4 py-4 text-zinc-600">
                  {item.createdAt || item.created_at
                    ? new Date(item.createdAt || item.created_at).toLocaleString("id-ID")
                    : "-"}
                </td>

                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {status === "DRAFT" && (
                      <>
                        <button
                          onClick={() => updatePurchaseRequestStatus(item.id, "APPROVED")}
                          className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          Approve
                        </button>

                        {["DRAFT", "APPROVED"].includes(
                          String(item.status || "").toUpperCase()
                        ) && (
                          <button
                            onClick={() => openGeneratePoModal(item)}
                            className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white"
                          >
                            Generate PO
                          </button>
                        )}

                        <button
                          onClick={() => updatePurchaseRequestStatus(item.id, "CANCELLED")}
                          className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {status === "APPROVED" && (
                      <button
                        onClick={() => updatePurchaseRequestStatus(item.id, "ORDERED")}
                        className="rounded-xl bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700"
                      >
                        Mark Ordered
                      </button>           
                    )} 
                      

                    {status === "ORDERED" && (
                      <button
                        onClick={() => updatePurchaseRequestStatus(item.id, "RECEIVED")}
                        className="rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                      >
                        Mark Received
                      </button>
                    )}

                    {(status === "RECEIVED" || status === "CANCELLED") && (
                      <span className="text-xs text-zinc-400">No action</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}

          {purchaseRequests.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                Belum ada Purchase Request.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)}

{activeTab === "purchaseOrder" && (
  <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-xl font-bold text-zinc-900">
          Purchase Order
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Daftar PO hasil generate dari Purchase Request.
        </p>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
        <div className="text-sm text-blue-600">Total PO</div>
        <div className="text-3xl font-bold text-blue-700">
          {purchaseOrders.length}
        </div>
      </div>
    </div>

    <div className="overflow-x-auto rounded-2xl border border-zinc-200">
      <table className="min-w-[1100px] w-full text-sm">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left">PO Number</th>
            <th className="px-4 py-3 text-left">Supplier</th>
            <th className="px-4 py-3 text-left">Product</th>
            <th className="px-4 py-3 text-left">SKU</th>
            <th className="px-4 py-3 text-left">Qty</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Tanggal</th>
            <th className="px-4 py-3 text-left">Aksi</th>
          </tr>
        </thead>

        <tbody>
          {purchaseOrders.map((po) => {
            const status = String(po.status || "").toUpperCase();

            return (
              <tr key={po.id} className="border-t hover:bg-zinc-50">
                <td className="px-4 py-4 font-mono text-xs font-semibold">
                  {po.po_number}
                </td>

                <td className="px-4 py-4">
                  {po.supplier_name || "-"}
                </td>

                <td className="px-4 py-4 font-medium text-zinc-900">
                  {po.product_name || "-"}
                </td>

                <td className="px-4 py-4 text-zinc-600">
                  {po.sku || "-"}
                </td>

                <td className="px-4 py-4 font-semibold">
                  {po.qty}
                </td>

                <td className="px-4 py-4">
                  <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {status}
                  </span>
                </td>

                <td className="px-4 py-4 text-zinc-600">
                  {po.created_at
                    ? new Date(po.created_at).toLocaleString("id-ID")
                    : "-"}
                </td>

                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {status === "DRAFT" && (
                      <>
                        <button
                          onClick={() => updatePurchaseOrderStatus(po.id, "SENT")}
                          className="rounded-xl bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700"
                        >
                          Mark Sent
                        </button>

                        <button
                          onClick={() => updatePurchaseOrderStatus(po.id, "CANCELLED")}
                          className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          Cancel
                        </button>
                      </>
                      )}

                        {status === "SENT" && (
                        <button
                          onClick={() => updatePurchaseOrderStatus(po.id, "RECEIVED")}
                          className="rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                        >
                          Mark Received
                        </button>
                       )}

                      {(status === "RECEIVED" || status === "CANCELLED") && (
                        <span className="text-xs text-zinc-400">No action</span>
                        )}
                    </div>
                </td>
              </tr>
            );
          })}

          {purchaseOrders.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-12 text-center text-zinc-500">
                Belum ada Purchase Order.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)}

{showGeneratePoModal && selectedPurchaseRequest && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
    <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-zinc-900">
            Generate Purchase Order
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Pilih supplier untuk membuat PO.
          </p>
        </div>

        <button
          onClick={() => {
            setShowGeneratePoModal(false);
            setSelectedPurchaseRequest(null);
          }}
        >
          <X className="h-5 w-5 text-zinc-500" />
        </button>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm text-zinc-500">Purchase Request</p>
        <p className="mt-1 font-mono text-sm font-semibold text-zinc-900">
          {selectedPurchaseRequest.pr_number || selectedPurchaseRequest.prNumber}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-zinc-500">Product</p>
            <p className="font-medium text-zinc-900">
              {selectedPurchaseRequest.product_name || selectedPurchaseRequest.productName}
            </p>
          </div>

          <div>
            <p className="text-zinc-500">Qty</p>
            <p className="font-medium text-zinc-900">
              {selectedPurchaseRequest.qty}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium text-zinc-700">
          Supplier
        </label>

        <select
          value={selectedSupplierId}
          onChange={(e) => setSelectedSupplierId(e.target.value)}
          className="w-full rounded-xl border border-zinc-300 p-3 text-sm outline-none focus:border-blue-600"
        >
          <option value="">Pilih Supplier</option>

          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.supplier_code || "-"} - {supplier.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium text-zinc-700">
          Note
        </label>

        <textarea
          rows={3}
          value={poNote}
          onChange={(e) => setPoNote(e.target.value)}
          className="w-full rounded-xl border border-zinc-300 p-3 text-sm outline-none focus:border-blue-600"
        />
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={() => {
            setShowGeneratePoModal(false);
            setSelectedPurchaseRequest(null);
          }}
          className="rounded-xl border border-zinc-300 px-4 py-2 text-zinc-700"
        >
          Batal
        </button>

        <button
          onClick={generatePurchaseOrder}
          className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Generate PO
        </button>
      </div>
    </div>
  </div>
)}

{showSupplierForm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
    <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-bold">
          {editingSupplier ? "Edit Supplier" : "Tambah Supplier"}
        </h3>

        <button onClick={() => setShowSupplierForm(false)}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <input
          placeholder="Supplier Code"
          className="rounded-xl border p-3"
          value={supplierForm.supplierCode}
          onChange={(e) =>
            setSupplierForm((prev) => ({
              ...prev,
              supplierCode: e.target.value,
            }))
          }
        />

        <input
          placeholder="Supplier Name"
          className="rounded-xl border p-3"
          value={supplierForm.name}
          onChange={(e) =>
            setSupplierForm((prev) => ({
              ...prev,
              name: e.target.value,
            }))
          }
        />

        <input
          placeholder="Contact Person"
          className="rounded-xl border p-3"
          value={supplierForm.contactPerson}
          onChange={(e) =>
            setSupplierForm((prev) => ({
              ...prev,
              contactPerson: e.target.value,
            }))
          }
        />

        <input
          placeholder="Phone"
          className="rounded-xl border p-3"
          value={supplierForm.phone}
          onChange={(e) =>
            setSupplierForm((prev) => ({
              ...prev,
              phone: e.target.value,
            }))
          }
        />

        <input
          placeholder="Email"
          className="rounded-xl border p-3"
          value={supplierForm.email}
          onChange={(e) =>
            setSupplierForm((prev) => ({
              ...prev,
              email: e.target.value,
            }))
          }
        />

        <select
          className="rounded-xl border p-3"
          value={supplierForm.status}
          onChange={(e) =>
            setSupplierForm((prev) => ({
              ...prev,
              status: e.target.value,
            }))
          }
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </div>

      <textarea
        placeholder="Address"
        className="mt-3 w-full rounded-xl border p-3"
        rows={3}
        value={supplierForm.address}
        onChange={(e) =>
          setSupplierForm((prev) => ({
            ...prev,
            address: e.target.value,
          }))
        }
      />

      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={() => setShowSupplierForm(false)}
          className="rounded-xl border px-4 py-2"
        >
          Batal
        </button>

        <button
          onClick={saveSupplier}
          className="rounded-xl bg-blue-600 px-4 py-2 text-white"
        >
          {editingSupplier ? "Update" : "Simpan"}
        </button>
      </div>
    </div>
  </div>
)}

{showReturnModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
    <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-bold">Create Return</h3>

        <button onClick={() => setShowReturnModal(false)}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <select
          className="rounded-xl border p-3"
          value={returnForm.returnType}
          onChange={(e) =>
            setReturnForm((prev) => ({
              ...prev,
              returnType: e.target.value,
            }))
          }
        >
          <option value="CUSTOMER">Customer Return</option>
          <option value="SUPPLIER">Supplier Return</option>
        </select>

        {returnForm.returnType === "SUPPLIER" && (
          <select
            className="rounded-xl border p-3"
            value={selectedReturnSupplierId}
            onChange={(e) => setSelectedReturnSupplierId(e.target.value)}
          >
            <option value="">Pilih Supplier</option>

            {suppliers.map((supplier: any) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.supplier_code || "-"} - {supplier.name}
              </option>
            ))}
          </select>
        )}

        <select
          className="rounded-xl border p-3"
          value={returnForm.productId}
          onChange={(e) => {
            const product = productOptions.find(
              (p: any) =>
                p.productId === e.target.value ||
                p.product_id === e.target.value
            );

            setReturnForm((prev) => ({
              ...prev,
              productId: e.target.value,
              productName:
                product?.productName ||
                product?.product_name ||
                "",
              sku: product?.sku || "",
            }));
          }}
        >
          <option value="">Pilih Produk</option>

          {productOptions.map((product: any) => (
            <option
              key={product.productId || product.product_id}
              value={product.productId || product.product_id}
            >
              {(product.productName || product.product_name || "Unknown")} -{" "}
              {product.sku || "-"}
            </option>
          ))}
        </select>

        <input
          type="number"
          min={1}
          className="rounded-xl border p-3"
          value={returnForm.qty}
          onChange={(e) =>
            setReturnForm((prev) => ({
              ...prev,
              qty: Number(e.target.value),
            }))
          }
          placeholder="Qty"
        />

        <input
          className="rounded-xl border p-3"
          value={returnForm.sku}
          disabled
          placeholder="SKU"
        />
      </div>

      <textarea
        className="mt-3 w-full rounded-xl border p-3"
        rows={3}
        value={returnForm.reason}
        onChange={(e) =>
          setReturnForm((prev) => ({
            ...prev,
            reason: e.target.value,
          }))
        }
        placeholder="Reason"
      />

      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={() => setShowReturnModal(false)}
          className="rounded-xl border px-4 py-2"
        >
          Batal
        </button>

        <button
          onClick={createReturn}
          className="rounded-xl bg-blue-600 px-4 py-2 text-white"
        >
          Simpan Return
        </button>
      </div>
    </div>
  </div>
)}

{showReturnDetailModal && selectedReturn && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-bold text-zinc-900">
          Return Detail
        </h3>

        <button
          onClick={() => {
            setShowReturnDetailModal(false);
            setSelectedReturn(null);
          }}
          className="text-zinc-500 hover:text-zinc-700"
        >
          ✕
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">

        <div>
          <p className="text-xs text-zinc-500">Return Number</p>
          <p className="font-semibold">
            {selectedReturn.return_number}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">Type</p>
          <p className="font-semibold">
            {selectedReturn.return_type}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">Product</p>
          <p className="font-semibold">
            {selectedReturn.product_name}
          </p>
        </div>

        {selectedReturn.return_type === "SUPPLIER" && (
          <div>
            <p className="text-xs text-zinc-500">Supplier</p>
            <p className="font-semibold">
              {selectedReturn.supplier_name || "-"}
            </p>
          </div>
        )}
        
        <div>
          <p className="text-xs text-zinc-500">SKU</p>
          <p className="font-semibold">
            {selectedReturn.sku}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">Qty</p>
          <p className="font-semibold">
            {selectedReturn.qty}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">Status</p>
          <p className="font-semibold">
            {selectedReturn.status}
          </p>
        </div>

      </div>

      <div className="mt-4">
        <p className="text-xs text-zinc-500">Reason</p>
        <p className="rounded-xl bg-zinc-50 p-3">
          {selectedReturn.reason || "-"}
        </p>
      </div>

      <div className="mt-5">
        <p className="mb-3 text-sm font-semibold text-zinc-900">
          Return Timeline
        </p>

      <div className="mt-4">
        <p className="mb-2 text-sm font-semibold text-zinc-900">
          Workflow History
        </p>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 text-sm">
          {[
            ["Created By", selectedReturn.created_by],
            ["Approved By", selectedReturn.approved_by],
            ["Rejected By", selectedReturn.rejected_by],
            ["Completed By", selectedReturn.completed_by],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 border-b border-zinc-200 px-3 py-2 last:border-b-0"
            >
              <span className="shrink-0 text-xs text-zinc-500">{label}</span>
              <span className="truncate text-xs font-semibold text-zinc-900">
                {getWorkflowUserLabel(value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="mt-1 h-3 w-3 rounded-full bg-blue-600" />
          <div>
            <p className="font-semibold text-zinc-900">Created</p>
            <p className="text-sm text-zinc-500">
              {selectedReturn.created_at
                ? new Date(selectedReturn.created_at).toLocaleString("id-ID")
                : "-"}
            </p>
          </div>
        </div>

        {selectedReturn.approved_at && (
          <div className="flex gap-3">
            <div className="mt-1 h-3 w-3 rounded-full bg-green-600" />
            <div>
              <p className="font-semibold text-zinc-900">Approved</p>
              <p className="text-sm text-zinc-500">
                {new Date(selectedReturn.approved_at).toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        )}

        {selectedReturn.rejected_at && (
          <div className="flex gap-3">
            <div className="mt-1 h-3 w-3 rounded-full bg-red-600" />
            <div>
              <p className="font-semibold text-zinc-900">Rejected</p>
              <p className="text-sm text-zinc-500">
                {new Date(selectedReturn.rejected_at).toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        )}

        {selectedReturn.completed_at && (
          <div className="flex gap-3">
            <div className="mt-1 h-3 w-3 rounded-full bg-zinc-900" />
            <div>
              <p className="font-semibold text-zinc-900">Completed</p>
              <p className="text-sm text-zinc-500">
                {new Date(selectedReturn.completed_at).toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        )}
      </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
      </div>
    </div>
  </div>
)}

 {activeTab === "autoRules" && (
  <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold">
          Auto Reorder Rules
        </h2>

        <p className="text-sm text-zinc-500">
          Aturan otomatis membuat restock request.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={runAutoReorderRules}
          disabled={runningAutoRules}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-white disabled:bg-zinc-300"
        >
          {runningAutoRules ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            "Run Auto Reorder"
          )}
        </button>

        <button
          onClick={() => setShowRuleForm(true)}
          className="rounded-xl bg-blue-600 px-4 py-2 text-white"
        >
          + Rule
        </button>
      </div>
    </div>
    
    <div className="mb-6 grid gap-3 md:grid-cols-5">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <p className="text-sm text-zinc-500">Total Rules</p>
        <p className="mt-2 text-2xl font-bold text-zinc-900">
          {autoRuleStats?.totalRules ?? 0}
        </p>
      </div>

    <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
      <p className="text-sm text-green-600">Active Rules</p>
      <p className="mt-2 text-2xl font-bold text-green-700">
        {autoRuleStats?.activeRules ?? 0}
      </p>
    </div>

    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
      <p className="text-sm text-blue-600">Triggered Today</p>
      <p className="mt-2 text-2xl font-bold text-blue-700">
        {autoRuleStats?.triggeredToday ?? 0}
      </p>
    </div>

    <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
      <p className="text-sm text-purple-600">Auto PR Today</p>
      <p className="mt-2 text-2xl font-bold text-purple-700">
        {autoRuleStats?.autoPrToday ?? 0}
      </p>
    </div>

    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <p className="text-sm text-emerald-600">Scheduler</p>
      <p className="mt-2 text-lg font-bold text-emerald-700">
        {autoRuleStats?.schedulerStatus || "UNKNOWN"}
      </p>
      <p className="mt-1 text-xs text-emerald-700">
        Last:{" "}
        {autoRuleStats?.lastRunAt
          ? new Date(autoRuleStats.lastRunAt).toLocaleString("id-ID")
          : "-"}
      </p>
    </div>
  </div>

    {showRuleForm && (
      <div className="mb-6 rounded-2xl border border-zinc-200 p-4">
        <label className="mb-2 block text-sm font-medium">
            Produk
        </label>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">          
          <select
            className="rounded-xl border p-3"
            value={ruleForm.productId}
            onChange={(e) => {
              const product = productOptions.find(
                (p: any) =>
                  p.product_id === e.target.value ||
                  p.productId === e.target.value
              );

              if (!product) return;

              setRuleForm((prev) => ({
                ...prev,
                productId:
                  product.productId ||
                  product.product_id,

                productName:
                  product.productName ||
                  product.product_name,

                sku: product.sku || "",
             }));
            }}
          >
            <option value="">
              Pilih Produk
            </option>

            {productOptions.map((product: any) => (
              <option
                key={product.productId || product.product_id}
                value={product.productId || product.product_id}
             >
                {(product.productName ||
                  product.product_name ||
                  "Unknown Product")}
                {" - "}
               {(product.sku || "-")}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Trigger Stock"
            className="rounded-xl border p-3"
            value={ruleForm.triggerStock}
            onChange={(e) =>
              setRuleForm((prev) => ({
                ...prev,
                triggerStock: Number(e.target.value),
              }))
            }
          />

          <input
            type="number"
            placeholder="Reorder Qty"
            className="rounded-xl border p-3"
            value={ruleForm.reorderQty}
            onChange={(e) =>
              setRuleForm((prev) => ({
                ...prev,
                reorderQty: Number(e.target.value),
              }))
            }
          />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            type="checkbox"
            checked={ruleForm.autoCreatePr}
            onChange={(e) =>
              setRuleForm((prev) => ({
                ...prev,
                autoCreatePr: e.target.checked,
              }))
            }
          />

          <span className="text-sm">
            Auto Create Purchase Request
          </span>
        </div>

        <button
          onClick={saveRule}
          className="mt-4 rounded-xl bg-green-600 px-4 py-2 text-white"
        >
          {editingRule ? "Update Rule" : "Simpan Rule"}
        </button>
      </div>
    )}

    <div className="overflow-x-auto rounded-2xl border border-zinc-200">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left">Product</th>
            <th className="px-4 py-3 text-left">SKU</th>
            <th className="px-4 py-3 text-left">Trigger</th>
            <th className="px-4 py-3 text-left">Reorder Qty</th>
            <th className="px-4 py-3 text-left">Auto PR</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Aksi</th>
          </tr>
        </thead>

        <tbody>
          {autoRules.map((rule) => (
            <tr key={rule.id} className="border-t">
              <td className="px-4 py-3">
                {rule.product_name}
              </td>

              <td className="px-4 py-3">
                {rule.sku}
              </td>

              <td className="px-4 py-3">
                ≤ {rule.trigger_stock}
              </td>

              <td className="px-4 py-3">
                {rule.reorder_qty}
              </td>

              <td className="px-4 py-3">
                {rule.auto_create_pr ? "Yes" : "No"}
              </td>

              <td className="px-4 py-3">
               <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                    rule.enabled
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-zinc-200 bg-zinc-50 text-zinc-500"
                  }`}
                >
                  {rule.enabled ? "Enabled" : "Disabled"}
                </span>
              </td>

              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => toggleAutoRule(rule)}
                  className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                >
                  {rule.enabled ? "Disable" : "Enable"}
                </button>

                <button
                  onClick={() => startEditRule(rule)}
                  className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteAutoRule(rule)}
                  className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white"
                >
                  Delete
                </button>
              </div>
             </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}

{activeTab === "suppliers" && (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold">Supplier Management</h2>
        <p className="text-sm text-slate-500">
          Kelola supplier untuk Purchase Order.
        </p>
      </div>

      <button
        onClick={() => {
          setEditingSupplier(null);
          setSupplierForm({
            supplierCode: "",
            name: "",
            contactPerson: "",
            phone: "",
            email: "",
            address: "",
            status: "ACTIVE",
          });
          setShowSupplierForm(true);
        }}
        className="rounded-xl bg-blue-600 px-4 py-2 text-white"
      >
        + Supplier
      </button>
    </div>

    <div className="overflow-hidden rounded-2xl border bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left">Code</th>
            <th className="px-4 py-3 text-left">Supplier</th>
            <th className="px-4 py-3 text-left">Contact</th>
            <th className="px-4 py-3 text-left">Phone</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Action</th>
          </tr>
        </thead>

        <tbody>
          {suppliers.map((supplier) => (
            <tr
              key={supplier.id}
              className="border-t"
            >
              <td className="px-4 py-3">
                {supplier.supplier_code}
              </td>

              <td className="px-4 py-3 font-medium">
                {supplier.name}
              </td>

              <td className="px-4 py-3">
                {supplier.contact_person}
              </td>

              <td className="px-4 py-3">
                {supplier.phone}
              </td>

              <td className="px-4 py-3">
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">
                  {supplier.status}
                </span>
              </td>

              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingSupplier(supplier);

                      setSupplierForm({
                        supplierCode: supplier.supplier_code || "",
                        name: supplier.name || "",
                        contactPerson: supplier.contact_person || "",
                        phone: supplier.phone || "",
                        email: supplier.email || "",
                        address: supplier.address || "",
                        status: supplier.status || "ACTIVE",
                      });

                      setShowSupplierForm(true);
                    }}
                    className="rounded-lg bg-amber-500 px-3 py-1 text-white"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteSupplier(supplier.id)}
                    className="rounded-lg bg-red-600 px-3 py-1 text-white"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {suppliers.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-8 text-center text-slate-500"
              >
                Belum ada supplier.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)}

{activeTab === "returns" && (
    <div className="space-y-6">

    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold">Return Center</h2>
        <p className="text-slate-500">Customer & Supplier Returns</p>
      </div>

      <div className="flex items-center gap-2">
        <Can permission="returns.export">
          <button onClick={exportReturnsCsv}>
            Export CSV
          </button>

          <button onClick={exportReturnsExcel}>
            Export Excel
          </button>

          <button onClick={exportReturnsPdf}>
            Export PDF
          </button>
        </Can>

        <Can permission="returns.create">
          <button
            onClick={async () => {
              await Promise.all([
                loadProductOptions(),
                loadSuppliers(),
              ]);

              setSelectedReturnSupplierId("");

              setReturnForm({
                returnType: "CUSTOMER",
                productId: "",
                productName: "",
                sku: "",
                qty: 1,
                reason: "",
              });

              setShowReturnModal(true);
            }}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Return
          </button>
        </Can>
      </div>
    </div>

    <div className="mb-6 grid gap-3 md:grid-cols-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <p className="text-sm text-zinc-500">Total Returns</p>
        <p className="mt-2 text-2xl font-bold text-zinc-900">
          {returnStats.total}
        </p>
      </div>

      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-700">Pending</p>
        <p className="mt-2 text-2xl font-bold text-yellow-700">
          {returnStats.pending}
        </p>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-700">Approved</p>
        <p className="mt-2 text-2xl font-bold text-blue-700">
          {returnStats.approved}
        </p>
      </div>

      <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
        <p className="text-sm text-green-700">Completed</p>
        <p className="mt-2 text-2xl font-bold text-green-700">
          {returnStats.completed}
        </p>
      </div>
    </div>

    <div className="grid gap-3 md:grid-cols-4">
      <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
        <p className="text-sm text-purple-700">Customer Returns</p>
        <p className="mt-2 text-2xl font-bold text-purple-700">
          {returnStats.customerReturns}
        </p>
      </div>

      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
        <p className="text-sm text-orange-700">Supplier Returns</p>
        <p className="mt-2 text-2xl font-bold text-orange-700">
          {returnStats.supplierReturns}
        </p>
      </div>

      <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
        <p className="text-sm text-green-700">Qty Returned</p>
        <p className="mt-2 text-2xl font-bold text-green-700">
          {returnStats.qtyReturned}
        </p>
      </div>

      <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">Qty Sent Back</p>
        <p className="mt-2 text-2xl font-bold text-red-700">
          {returnStats.qtySentBack}
        </p>
      </div>
    </div>

    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-zinc-900">
            Return Trend
          </h3>
          <p className="text-sm text-zinc-500">
            Customer return, supplier return, dan qty trend.
          </p>
        </div>

        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
          Last 30 Days
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 p-4">
          <h4 className="mb-4 font-semibold text-zinc-900">
            Return Trend
          </h4>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={returnChartData}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="date" />

                <YAxis allowDecimals={false} />

                <Tooltip />

                <Legend />

                <Bar
                  dataKey="customerReturns"
                  name="Customer Return"
                  fill="#7C3AED"
                  radius={[6, 6, 0, 0]}
                />

                <Bar
                  dataKey="supplierReturns"
                  name="Supplier Return"
                  fill="#F97316"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      
      <div className="rounded-2xl border border-zinc-200 p-4">
        <h4 className="mb-4 font-semibold text-zinc-900">
          Qty Movement Trend
        </h4>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={returnChartData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="date" />

              <YAxis allowDecimals={false} />

              <Tooltip />

              <Legend />

              <Line
                type="monotone"
                dataKey="qtyReturned"
                name="Qty Returned"
                stroke="#16A34A"
                strokeWidth={3}
              />

              <Line
                type="monotone"
                dataKey="qtySentBack"
                name="Qty Sent Back"
                stroke="#DC2626"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </div>

    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-zinc-900">
            Top Return Reasons
          </h3>
          <p className="text-sm text-zinc-500">
            Alasan return paling sering muncul.
          </p>
        </div>

        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
          Top 5
        </span>
      </div>

      {returnReasonStats.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
          Belum ada data alasan return.
        </div>
      ) : (
        <div className="space-y-3">
          {returnReasonStats.map((item) => {
            const percent =
              returnStats.total > 0
                ? Math.round((item.count / returnStats.total) * 100)
                : 0;

            return (
              <div
                key={item.reason}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
              >
                <div className="mb-2 flex items-center justify-between gap-4">
                  <p className="truncate font-semibold text-zinc-900">
                    {item.reason}
                  </p>

                  <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    {item.count} return
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <p className="mt-1 text-xs text-zinc-500">
                  {percent}% dari total return
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>

    <div className="grid gap-3 md:grid-cols-3">
      <input
        value={returnSearch}
        onChange={(e) => setReturnSearch(e.target.value)}
        placeholder="Cari return no, produk, supplier, reason..."
        className="rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-blue-600"
     />

      <select
        value={returnTypeFilter}
        onChange={(e) => setReturnTypeFilter(e.target.value)}
        className="rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-blue-600"
      >
        <option value="ALL">All Type</option>
        <option value="CUSTOMER">Customer Return</option>
        <option value="SUPPLIER">Supplier Return</option>
      </select>

      <select
        value={returnStatusFilter}
        onChange={(e) => setReturnStatusFilter(e.target.value)}
        className="rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-blue-600"
      >
        <option value="ALL">All Status</option>
        <option value="PENDING">Pending</option>
        <option value="APPROVED">Approved</option>
        <option value="COMPLETED">Completed</option>
        <option value="REJECTED">Rejected</option>
      </select>
  </div>
    
  <div className="overflow-x-auto rounded-2xl border border-zinc-200">
    <table className="w-full text-sm">
        <thead className="bg-slate-50">
        <tr>
          <th className="px-4 py-3 text-left">Return No</th>
          <th className="px-4 py-3 text-left">Type</th>
          <th className="px-4 py-3 text-left">Product</th>
          <th className="px-4 py-3 text-left">Qty</th>
          <th className="px-4 py-3 text-left">Status</th>
          <th className="px-4 py-3 text-left">Action</th>
        </tr>
      </thead>

      <tbody>
        {filteredReturns.map((item: any) => (
          <tr 
            key={item.id} 
            className="border-t"
          >
            <td className="px-4 py-4">
              <button
                onClick={() => openReturnDetail(item)}
                className="font-semibold text-blue-600 hover:text-blue-800"
              >
                {item.return_number || item.returnNumber}
              </button>
            </td>

            <td className="px-4 py-3">
              {item.return_type}
            </td>

            <td className="px-4 py-3">
              {item.product_name}
            </td>

            <td className="px-4 py-3">
              {item.qty}
            </td>

            <td className="px-4 py-4">
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                  item.status === "PENDING"
                    ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                    : item.status === "APPROVED"
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : item.status === "COMPLETED"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {item.status}
              </span>
            </td>

          <td className="px-4 py-4">
            <div className="flex flex-wrap gap-2">
              {item.status === "PENDING" && (
                <>
                  <Can permission="returns.approve">
                    <button
                      onClick={() => updateReturnStatus(item.id, "APPROVED")}
                      className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Approve
                    </button>
                  </Can>

                  <Can permission="returns.reject">
                    <button
                      onClick={() => updateReturnStatus(item.id, "REJECTED")}
                      className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </Can>
                </>
              )}

              {item.status === "APPROVED" && (
                <Can permission="returns.complete">
                  <button
                    onClick={() => updateReturnStatus(item.id, "COMPLETED")}
                    className="rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                  >
                    Complete
                  </button>
                </Can>
              )}

              {(item.status === "COMPLETED" ||
                item.status === "REJECTED") && (
                <span className="text-xs text-zinc-400">
                  No action
                </span>
              )}
            </div>
          </td>
        </tr>
      ))}
     </tbody>
    </table>
   </div>
  </div> 
)}

      {activeTab === "movements" && (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-900">
            Stock Movement History
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Audit perubahan stok dari update manual, order, return, dan sync.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={movementSearch}
                onChange={(e) => setMovementSearch(e.target.value)}
                placeholder="Cari produk, SKU, reason..."
                className="w-full rounded-2xl border border-zinc-300 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-zinc-900"
              />
            </div>

            <select
              value={movementSource}
              onChange={(e) => setMovementSource(e.target.value)}
              className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-900"
            >
              <option value="">Semua Source</option>
              <option value="MANUAL">MANUAL</option>
              <option value="ORDER">ORDER</option>
              <option value="RETURN">RETURN</option>
              <option value="SYNC">SYNC</option>
              <option value="API">API</option>
              </select>

              <select
                value={movementType}
                onChange={(e) => setMovementType(e.target.value)}
                className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-900"
              >
              <option value="">Semua Type</option>
              <option value="ADJUSTMENT">ADJUSTMENT</option>
              <option value="SALE">SALE</option>
              <option value="ORDER">ORDER</option>
              <option value="RETURN">RETURN</option>
              <option value="RESTOCK">RESTOCK</option>
              <option value="STOCK_IN">STOCK_IN</option>
              <option value="SYNC">SYNC</option>
            </select>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-500">Today</p>
              <p className="mt-2 text-2xl font-bold text-zinc-900">
                {movementStats.todayCount}
              </p>
            </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-sm text-zinc-500">Manual</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">
              {movementStats.manualCount}
            </p>
          </div>

           <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-sm text-zinc-500">Orders</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">
              {movementStats.orderCount}
            </p>
          </div>

           <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-sm text-zinc-500">Sync/API</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">
              {movementStats.syncCount}
            </p>
           </div>
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="mb-4">
              <h4 className="font-semibold text-zinc-900">Movement Analytics</h4>
              <p className="text-sm text-zinc-500">
                Total quantity movement berdasarkan tanggal.
              </p>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={movementChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(value) => [`${value} qty`, "Movement"]}/>
                  <Bar dataKey="qty" fill="#2563eb" radius={[8, 8, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-200">
            <table className="min-w-[1000px] w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left">Tanggal</th>
                  <th className="px-4 py-3 text-left">Produk</th>
                  <th className="px-4 py-3 text-left">Source</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Qty</th>
                  <th className="px-4 py-3 text-left">Before</th>
                  <th className="px-4 py-3 text-left">After</th>
                  <th className="px-4 py-3 text-left">Reason</th>
                </tr>
              </thead>

              <tbody>
                {loadingMovements && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-zinc-500"
                    >
                      Memuat stock movement...
                    </td>
                  </tr>
                )}

                {!loadingMovements &&
                  movements.map((m) => (
                    <tr key={m.id}
                      onClick={() => setSelectedMovement(m)}
                      className="cursor-pointer border-t hover:bg-zinc-50"
                    >
                      <td className="whitespace-nowrap px-4 py-3">
                        {m.created_at
                          ? new Date(m.created_at).toLocaleString("id-ID")
                          : "-"}
                      </td>

                      <td className="max-w-[260px] truncate px-4 py-3">
                        <div className="font-medium text-zinc-900">
                          {m.product_name || m.product_id}
                        </div>
                        <div className="text-xs text-zinc-500">
                          SKU: {m.sku || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                          {m.source_type || "-"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getMovementTypeClass(
                            m.movement_type
                          )}`}
                        >
                          {m.movement_type || "-"}
                        </span>
                      </td>

                      <td
                        className={`px-4 py-3 font-semibold ${
                          Number(m.quantity || 0) >= 0
                            ? "text-green-600 font-bold"
                            : "text-red-600 font-bold"
                        }`}
                      >
                        {Number(m.quantity || 0) > 0 ? "+" : ""}
                        {m.quantity}
                      </td>

                      <td className="px-4 py-3">{m.stock_before}</td>

                      <td className="px-4 py-3">{m.stock_after}</td>

                      <td
                        className="max-w-[260px] truncate px-4 py-3"
                        title={m.reason || ""}
                      >
                        {m.reason || "-"}
                      </td>
                    </tr>
                  ))}

                {!loadingMovements && movements.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-zinc-500"
                    >
                      Belum ada stock movement.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900">Update Stok</h3>
              <button onClick={() => setEditing(null)}>
                <X className="h-5 w-5 text-zinc-500" />
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm text-zinc-500">Produk</p>
              <p className="mt-1 font-medium text-zinc-900">
                {editing.productName || "-"}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                SKU: {editing.sku || "-"}
              </p>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Stok Baru
              </label>
              <input
                type="number"
                value={stockDraft}
                onChange={(e) => setStockDraft(Number(e.target.value))}
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditing(null)}
                className="rounded-2xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Batal
              </button>

              <Can permission="inventory.update">
                <button
                  onClick={() => updateMutation.mutate()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="h-4 w-4" />
                  )}
                  Simpan
                </button>
              </Can>
            </div>
          </div>  
        </div>
      )}

      {selectedMovement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">
                    Movement Detail
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    Detail audit perubahan stok inventory.
                  </p>
                </div>

                <button
                  onClick={() => setSelectedMovement(null)}
                  className="rounded-xl border border-zinc-200 p-2 hover:bg-zinc-50"
                >
                  <X className="h-5 w-5 text-zinc-500" />
                </button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 p-4">
                  <p className="text-xs text-zinc-500">Movement ID</p>
                  <p className="mt-1 break-all font-mono text-sm text-zinc-900">
                    {selectedMovement.id}
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-200 p-4">
                  <p className="text-xs text-zinc-500">Created At</p>
                  <p className="mt-1 text-sm font-medium text-zinc-900">
                    {selectedMovement.created_at
                      ? new Date(selectedMovement.created_at).toLocaleString("id-ID")
                      : "-"}
                    </p>
                  </div>

                <div className="rounded-2xl border border-zinc-200 p-4">
                  <p className="text-xs text-zinc-500">Product</p>
                  <p className="mt-1 break-all text-sm font-semibold text-zinc-900">
                    {selectedMovement.product_name || selectedMovement.product_id}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    SKU: {selectedMovement.sku || "-"}
                 </p>
                </div>

        <div className="rounded-2xl border border-zinc-200 p-4">
          <p className="text-xs text-zinc-500">Product ID</p>
          <p className="mt-1 break-all font-mono text-sm text-zinc-900">
            {selectedMovement.product_id}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 p-4">
          <p className="text-xs text-zinc-500">Source</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900">
            {selectedMovement.source_type || "-"}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 p-4">
          <p className="text-xs text-zinc-500">Movement Type</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900">
            {selectedMovement.movement_type || "-"}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 p-4">
          <p className="text-xs text-zinc-500">Quantity</p>
          <p
            className={`mt-1 text-lg font-bold ${
              Number(selectedMovement.quantity || 0) >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {Number(selectedMovement.quantity || 0) > 0 ? "+" : ""}
            {selectedMovement.quantity}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 p-4">
          <p className="text-xs text-zinc-500">Stock Change</p>
          <p className="mt-1 text-lg font-bold text-zinc-900">
            {selectedMovement.stock_before} → {selectedMovement.stock_after}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-zinc-200 p-4">
        <p className="text-xs text-zinc-500">Reason</p>
        <p className="mt-1 text-sm text-zinc-900">
          {selectedMovement.reason || "-"}
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-zinc-200 p-4">
        <p className="text-xs text-zinc-500">Metadata</p>
        <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-zinc-950 p-4 text-xs text-zinc-100">
          {JSON.stringify((selectedMovement as any).metadata || {}, null, 2)}
        </pre>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={() => setSelectedMovement(null)}
          className="rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
    )}   

       <button
          onClick={() => setShowAiCopilot(!showAiCopilot)}
          className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full bg-indigo-600 text-white shadow-2xl hover:scale-105 transition"
        >
          🤖
        </button>

{showAiCopilot && (
  <div className="fixed bottom-24 right-6 z-50 w-[370px] h-[520px] rounded-2xl bg-white shadow-2xl border flex flex-col overflow-hidden">    
      <div className="bg-indigo-600 text-white px-5 py-4">
       <div className="font-bold">
          🤖 AI COO
       </div>

      <div className="text-xs opacity-80">
          Online • Inventory Intelligence
      </div>
    </div>
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
    {copilotMessages.map((msg,index)=>(
  
<div
  className={`max-w-[80%] rounded-2xl px-4 py-3 whitespace-pre-wrap ${
    msg.role === "user"
      ? "bg-indigo-600 text-white"
      : "bg-gray-100 text-zinc-800"
  }`}
>
  {msg.content}

  {msg.role === "assistant" && msg.actions?.length > 0 && (
    <div className="mt-3 flex flex-wrap gap-2">
      {msg.actions.map((action: any) => (
        <button
          key={`${action.actionType}-${action.label}`}
          onClick={() => {
            handleAiAction(action.actionType);
            setShowAiCopilot(false);
          }}
          className="rounded-full bg-white px-3 py-1 text-xs font-bold text-indigo-700 shadow-sm hover:bg-indigo-50"
        >
          {action.label}
        </button>
      ))}
    </div>
  )}  
 </div>
))}

{copilotLoading && (
  <div className="flex items-center gap-2 text-sm text-gray-500">
    <div className="flex gap-1">
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"/>
        <span
            className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
            style={{ animationDelay: "0.15s" }}
        />
        <span
            className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
            style={{ animationDelay: "0.3s" }}
        />
      </div>
       🤖 AI COO sedang menganalisis data inventory...

    </div>
   )} 

  <div ref={chatEndRef} />

 </div>

 <div className="flex flex-wrap gap-2 p-3 border-t">
  {[
    "Ringkas inventory hari ini",
    "Apakah ada risiko stockout?",
    "Supplier mana yang paling buruk?",
    "PO mana yang harus dipantau?",
  ].map((q)=>(

  <button
    key={q}
    onClick={()=>sendCopilot(q)}
    className="text-xs rounded-full bg-gray-100 hover:bg-indigo-100 px-3 py-1"
  >
    {q}
  </button>
))}
</div>

  <div className="border-t p-3 flex gap-2">
  <input
    ref={inputRef}
    value={copilotInput}
    onChange={(e)=>setCopilotInput(e.target.value)}
    onKeyDown={(e)=>{
    if(e.key==="Enter"){
    sendCopilot();
    setCopilotInput("");
    }
  }}
    placeholder="Tanya apa saja..."
    className="flex-1 border rounded-xl px-3 py-2"
  />

  <button
    disabled={copilotLoading}
    onClick={() => sendCopilot()}
    className="bg-indigo-600 text-white px-4 rounded-xl disabled:opacity-50"
  >
    Send
  </button>
 </div>
</div>
)}

{selectedAutonomousReport && (
  <div className="fixed inset-0 z-50 flex items-start pt-10 justify-center bg-black/40 px-4">
    <div className="max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-zinc-100 pb-4">
        <div>
          <p className="text-sm font-black text-indigo-700">
            🛰 Autonomous Report Detail
          </p>

          <h2 className="mt-1 text-2xl font-bold text-zinc-900">
            {selectedAutonomousReport.operationStatus}
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            {selectedAutonomousReport.createdAt
              ? new Date(selectedAutonomousReport.createdAt).toLocaleString("id-ID")
              : "-"}
          </p>
        </div>

        <button
          onClick={() => setSelectedAutonomousReport(null)}
          className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-bold text-zinc-600 hover:bg-zinc-50"
        >
          Close
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 p-4">
          <p className="text-xs font-bold text-zinc-500">Critical</p>
          <p className="mt-2 text-3xl font-black text-red-600">
            {selectedAutonomousReport.criticalCount || 0}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 p-4">
          <p className="text-xs font-bold text-zinc-500">Warning</p>
          <p className="mt-2 text-3xl font-black text-yellow-600">
            {selectedAutonomousReport.warningCount || 0}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 p-4">
          <p className="text-xs font-bold text-zinc-500">Status</p>
          <span
            className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-black ${getAutonomousStatusClass(
              selectedAutonomousReport.operationStatus
            )}`}
          >
            {selectedAutonomousReport.operationStatus}
          </span>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-xs font-black uppercase tracking-wide text-zinc-400">
          Summary
        </p>
        <p className="mt-2 text-sm leading-6 text-zinc-700">
          {selectedAutonomousReport.summary}
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 p-4">
          <h3 className="font-bold text-zinc-900">Forecast Risks</h3>

          <div className="mt-3 space-y-3">
            {(selectedAutonomousReport.detail?.forecastRisks || []).length === 0 && (
              <p className="text-sm text-zinc-500">Tidak ada forecast risk.</p>
            )}

            {(selectedAutonomousReport.detail?.forecastRisks || []).map((item: any) => (
              <div
                key={item.productId || item.sku}
                className="rounded-xl border border-yellow-100 bg-yellow-50 p-3"
              >
                <p className="font-bold text-zinc-900">{item.productName}</p>
                <p className="text-xs text-zinc-500">SKU: {item.sku}</p>
                <p className="mt-2 text-sm text-zinc-700">
                  Stock {item.availableStock} / Min {item.minStockLevel} · Suggested {item.suggestedQty}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 p-4">
          <h3 className="font-bold text-zinc-900">Bad Suppliers</h3>

          <div className="mt-3 space-y-3">
            {(selectedAutonomousReport.detail?.badSuppliers || []).length === 0 && (
              <p className="text-sm text-zinc-500">Tidak ada supplier grade buruk.</p>
            )}

            {(selectedAutonomousReport.detail?.badSuppliers || []).map((item: any) => (
              <div
                key={`${item.supplierName}-${item.supplierPhone}`}
                className="rounded-xl border border-red-100 bg-red-50 p-3"
              >
                <p className="font-bold text-zinc-900">{item.supplierName}</p>
                <p className="text-xs text-zinc-500">{item.supplierPhone || "-"}</p>
                <p className="mt-2 text-sm text-zinc-700">
                  Score {item.score} · Grade {item.grade} · Total PO {item.totalPo}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-zinc-200 p-4">
        <h3 className="font-bold text-zinc-900">Recommended Actions</h3>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {(selectedAutonomousReport.detail?.recommendedActions || []).length === 0 && (
            <p className="text-sm text-zinc-500">
              Tidak ada rekomendasi action.
            </p>
          )}

          {(selectedAutonomousReport.detail?.recommendedActions || []).map((action: any) => (
            <div
              key={action.type}
              className="rounded-xl border border-indigo-100 bg-indigo-50 p-3"
            >
              <p className="font-bold text-indigo-900">{action.title}</p>

              <p className="mt-1 text-sm text-indigo-700">
                {action.description}
              </p>

              <button
                onClick={() => {
                  if (action.type === "CREATE_RESTOCK_DRAFT") {
                    setSelectedAutonomousReport(null);
                    setActiveTab("reorder");
                    return;
                  }

                  if (action.type === "REVIEW_SUPPLIER") {
                    setSelectedAutonomousReport(null);
                    setActiveTab("supplierScore");
                    return;
                  }

                  if (action.type === "CHECK_LEAD_TIME") {
                    setSelectedAutonomousReport(null);
                    setActiveTab("leadTime");
                    return;
                  }
                }}
                className="mt-3 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700"
              >
                Open Action
              </button>
            </div>
          ))}
        </div>
      </div>

<div className="mt-5 rounded-2xl border border-zinc-200 p-4">
  <h3 className="font-bold text-zinc-900">AI Actions Executed</h3>

  <div className="mt-3 space-y-3">
    {(selectedAutonomousReport.detail?.actionsExecuted || []).length === 0 && (
      <p className="text-sm text-zinc-500">
        Belum ada aksi otomatis yang dijalankan AI.
      </p>
    )}

{(selectedAutonomousReport.detail?.actionsExecuted || []).map((action: any, index: number) => {
  const isSupplierConfirmed = action.type === "SUPPLIER_CONFIRMED";

  return (
    <div
      key={`${action.type}-${action.purchaseOrderId || action.productId || index}`}
      className={`rounded-xl border p-3 ${
        action.status === "SUCCESS"
          ? "border-green-100 bg-green-50"
          : action.status === "SKIPPED"
          ? "border-yellow-100 bg-yellow-50"
          : "border-zinc-200 bg-zinc-50"
      }`}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-bold text-zinc-900">
            {action.status === "SUCCESS" ? "✅" : "⏭️"} {actionTitles[action.type] || action.type}
          </p>

          {isSupplierConfirmed ? (
            <>
              <p className="mt-1 text-sm font-semibold text-zinc-900">
                {action.poNumber}
              </p>
              <p className="text-sm text-zinc-600">
                {action.supplierName}
              </p>
              <p className="text-sm text-zinc-600">
                {action.productName}
              </p>
              <p className="mt-1 text-xs font-semibold text-green-700">
                Qty {action.requestedQty}
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-zinc-700">
                {action.productName || "-"}
              </p>

              {action.reason && (
                <p className="mt-1 text-xs text-zinc-500">
                  {action.reason}
                </p>
              )}

              {action.requestedQty && (
                <p className="mt-1 text-xs font-semibold text-green-700">
                  Requested Qty: {action.requestedQty}
                </p>
              )}
            </>
          )}
        </div>

        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
            action.status === "SUCCESS"
              ? "bg-green-100 text-green-700"
              : action.status === "SKIPPED"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-zinc-100 text-zinc-700"
          }`}
        >
          {statusLabels[action.status] || action.status}
        </span>
      </div>

      {action.existingId && (
        <div className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-xs text-zinc-500">
          Existing Request ID: {action.existingId}
        </div>
      )}
    </div>
  );
})}
  </div>
</div>

{selectedAutonomousReport.detail?.supplierUpdates &&  (
  <div className="rounded-2xl border bg-white p-6 mt-6">
    <h3 className="text-xl font-semibold mb-5">
      Supplier Confirmation
    </h3>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

      <div className="rounded-xl border p-4">
        <div className="text-gray-500 text-sm">
          Confirmed
        </div>

        <div className="text-3xl font-bold text-green-600">
          {selectedAutonomousReport.detail?.supplierUpdates?.confirmed ?? 0}
        </div>
      </div>

      <div className="rounded-xl border p-4">
        <div className="text-gray-500 text-sm">
          Partial
        </div>

        <div className="text-3xl font-bold text-orange-500">
          {selectedAutonomousReport.detail?.supplierUpdates?.partial ?? 0}
        </div>
      </div>

      <div className="rounded-xl border p-4">
        <div className="text-gray-500 text-sm">
          Rejected
        </div>

        <div className="text-3xl font-bold text-red-600">
          {selectedAutonomousReport.detail?.supplierUpdates?.rejected ?? 0}
        </div>
      </div>

      <div className="rounded-xl border p-4">
        <div className="text-gray-500 text-sm">
          Waiting
        </div>

        <div className="text-3xl font-bold text-blue-600">
          {selectedAutonomousReport.detail?.supplierUpdates?.waiting ?? 0}
        </div>
      </div>
    </div>
  </div>
)}

{selectedAutonomousReport.detail?.recent?.length > 0 && (
  <div className="mt-6 rounded-2xl border bg-white p-6">
    <h3 className="text-xl font-semibold mb-4">
      Recent Supplier Activity
    </h3>
    <div className="space-y-3">
      {selectedAutonomousReport.detail.recent.map((item: any) => (
        <div
          key={item.purchaseOrderId}
          className="border rounded-xl p-4 flex justify-between items-center"
        >
          <div>
            <div className="font-semibold">
              {item.poNumber}
            </div>
            <div className="text-gray-500 text-sm">
              {item.supplierName}
            </div>
            <div className="text-gray-500 text-sm">
              {item.productName}
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">
              Qty {item.qty}
            </div>
            <div className="text-green-600 font-bold">
              {item.status}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

{selectedAutonomousReport.detail?.supplierUpdates?.recent?.length > 0 && (
  <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
    <h3 className="font-bold text-lg text-zinc-900">
      Recent Supplier Activity
    </h3>

    <div className="mt-4 space-y-3">
      {selectedAutonomousReport.detail.supplierUpdates.recent.map((item: any) => (
        <div
          key={item.purchaseOrderId}
          className="rounded-xl border border-green-100 bg-green-50 p-4"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-bold text-zinc-900">
                {item.poNumber}
              </p>

              <p className="mt-1 text-sm text-zinc-600">
                {item.supplierName}
              </p>

              <p className="text-sm text-zinc-600">
                {item.productName}
              </p>

              <p className="mt-1 text-xs font-semibold text-green-700">
                Qty {item.qty}
              </p>
            </div>

            <div className="text-left md:text-right">
              <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                {item.status}
              </span>

              <p className="mt-2 text-xs text-zinc-500">
                {item.updatedAt
                  ? new Date(item.updatedAt).toLocaleString("id-ID")
                  : "-"}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

  <div className="mt-6 rounded-2xl border p-5">
    <h3 className="font-bold text-lg">
        Business Impact
    </h3>
    <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border p-4">
            <div className="text-sm text-zinc-500">
                Potential Revenue Loss
            </div>
            <div className="mt-2 text-2xl font-bold text-red-600">
                Rp{" "}
                {selectedAutonomousReport.detail?.businessImpact?.potentialRevenueLoss?.toLocaleString(
                    "id-ID"
                )}
            </div>
        </div>

        <div className="rounded-xl border p-4">
            <div className="text-sm text-zinc-500">
                Estimated Saving
            </div>
            <div className="mt-2 text-2xl font-bold text-green-600">
                Rp{" "}
                {selectedAutonomousReport.detail?.businessImpact?.estimatedSaving?.toLocaleString(
                    "id-ID"
                )}
            </div>
        </div>

        <div className="rounded-xl border p-4">
            <div className="text-sm text-zinc-500">
                Supplier Risk
            </div>
            <div className="mt-2 text-xl font-bold text-orange-600">
                {selectedAutonomousReport.detail?.businessImpact?.supplierRisk}
            </div>
        </div>

        <div className="rounded-xl border p-4">
            <div className="text-sm text-zinc-500">
                Stockout Risk
            </div>
            <div className="mt-2 text-2xl font-bold text-blue-600">
                {selectedAutonomousReport.detail?.businessImpact?.stockoutRiskCount}
            </div>
        </div>
    </div>
</div>
    </div>
  </div>
)}
  </div>
   );
}
        