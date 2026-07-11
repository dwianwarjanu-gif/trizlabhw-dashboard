import axios, { AxiosResponse } from 'axios'
import toast from 'react-hot-toast'
import { LoginCredentials, RegisterData, AuthResponse, RefreshTokenResponse } from '@/types/auth';
// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://api.trizlabhw.com/api",
  withCredentials: true,
});

// REQUEST INTERCEPTOR
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const tenant = localStorage.getItem("tenant");
  const url = String(config.url || "");

  config.headers = config.headers || {};

  const isLoginOrRegister =
    url.includes("/auth/login") || url.includes("/auth/register");

  // Jangan kirim token ke login/register
  if (token && !isLoginOrRegister) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (tenant) {
    config.headers["x-tenant"] = tenant;
    config.headers["x-tenant-id"] = tenant;
}

  return config;
});


// Response interceptor for error handling
const isAuthRefreshRequest = (url?: string) =>
  typeof url === 'string' && url.includes('/auth/refresh');

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const requestUrl = String(originalRequest.url || '');

    // Kalau request refresh sendiri gagal, jangan retry lagi.
    // Cukup clear session dan lempar error ke caller.
    if (error.response?.status === 401 && isAuthRefreshRequest(requestUrl)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('permissions');      
      return Promise.reject(error);
    }

    const authError =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "";

    if (
      error.response?.status === 401 &&
      String(authError).toLowerCase().includes("session revoked")
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("permissions");

      window.location.href = "/login";

      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const token = localStorage.getItem('token');

        if (!token) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('permissions');
          return Promise.reject(error);
        }

        // Pakai axios biasa, bukan instance "api",
        // supaya refresh request tidak masuk interceptor lagi.
        const refreshRes = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${token}`,
              ...(localStorage.getItem('tenant')
                ? { 'x-tenant': localStorage.getItem('tenant') as string }
                : {}),
            },
          }
        );

        const newToken = refreshRes.data?.token;
        if (!newToken) {
          throw new Error('Token missing from refresh response');
        }

        localStorage.setItem('token', newToken);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('permissions');

        window.location.href = "/login";

        return Promise.reject(error);
      }
    }

    if (error.response?.status >= 500) {
      toast.error('Server error');
    } else if (error.response?.status === 403) {
      toast.error('Forbidden');
    } else if (error.response?.status === 404) {
      toast.error('Not found');
    } else if (!error.response) {
      toast.error('Network error');
    }

    return Promise.reject(error);
  }
);
     

// Auth API
export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post('/auth/login', credentials),
  
  register: (data: RegisterData) =>
    api.post('/auth/register', data),
  
  logout: () =>
    api.post('/auth/logout'),
  
  getProfile: () =>
    api.get('/me'),
  
  refreshToken: () =>
    api.post('/auth/refresh'),
  
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }) => api.post("/me/change-password", data),
}

// Products API
export const productsApi = {
  getAll: (params?: any): Promise<AxiosResponse<any>> =>
    api.get('/products', { params }),
  
  getById: (id: string): Promise<AxiosResponse<any>> =>
    api.get(`/products/${id}`),
  
  create: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/products', data),
  
  update: (id: string, data: any): Promise<AxiosResponse<any>> =>
    api.put(`/products/${id}`, data),
  
  delete: (id: string): Promise<AxiosResponse<any>> =>
    api.delete(`/products/${id}`),
  
  bulkSync: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/products/bulk-sync', data),

  uploadImage: (formData: FormData): Promise<AxiosResponse<any>> =>
    api.post("/products/upload-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  uploadImages: (formData: FormData): Promise<AxiosResponse<any>> =>
    api.post("/products/upload-images", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  getCategories: (): Promise<AxiosResponse<any>> =>
    api.get("/products/categories"),

  getBrands: (): Promise<AxiosResponse<any>> =>
    api.get("/products/brands"),

  createCategory: (data: any): Promise<AxiosResponse<any>> =>
    api.post("/products/categories", data),

  createBrand: (data: any): Promise<AxiosResponse<any>> =>
    api.post("/products/brands", data),

  getVariants: (productId: string): Promise<AxiosResponse<any>> =>
    api.get(`/products/${productId}/variants`),

  createVariant: (productId: string, data: any): Promise<AxiosResponse<any>> =>
    api.post(`/products/${productId}/variants`, data),

  updateVariant: (variantId: string, data: any): Promise<AxiosResponse<any>> =>
    api.put(`/products/variants/${variantId}`, data),

  deleteVariant: (variantId: string): Promise<AxiosResponse<any>> =>
    api.delete(`/products/variants/${variantId}`),
}

// Orders API
export const ordersApi = {
  getAll: (params?: any): Promise<AxiosResponse<any>> =>
    api.get('/orders', { params }),

  getById: (id: string): Promise<AxiosResponse<any>> =>
    api.get(`/orders/${id}`),

  updateStatus: (id: string, status: string, reason?: string, updateMarketplace?: boolean): Promise<AxiosResponse<any>> =>
    api.patch(`/orders/${id}/status`, { status, reason, updateMarketplace }),

  assignOrder: (id: string, userId: string, reason?: string): Promise<AxiosResponse<any>> =>
    api.patch(`/orders/${id}/assign`, { assignedUserId: userId, reason }),

  addTag: (id: string, tag: string): Promise<AxiosResponse<any>> =>
    api.post(`/orders/${id}/tags`, { tag }),

  removeTag: (id: string, tagId: string): Promise<AxiosResponse<any>> =>
    api.delete(`/orders/${id}/tags/${tagId}`),

  sync: (marketplaceAccountId?: string, options?: any): Promise<AxiosResponse<any>> =>
    api.post('/orders/sync', { marketplaceAccountId, ...options }),

  getStats: (timeRange?: string): Promise<AxiosResponse<any>> =>
    api.get('/order-management/stats', { params: { timeRange } }),
}

// Inventory API
export const inventoryApi = {
  getAll: (params?: any): Promise<AxiosResponse<any>> =>
    api.get("/inventory", { params }),

  updateStock: (productId: string, data: any): Promise<AxiosResponse<any>> =>
    api.patch(`/inventory/${productId}`, data),

  getLowStock: (): Promise<AxiosResponse<any>> =>
    api.get("/inventory/low-stock"),

  getMovements: (params?: any): Promise<AxiosResponse<any>> =>
    api.get("/inventory/movements", { params }),

  getRestockRequests: (): Promise<AxiosResponse<any>> =>
    api.get("/inventory/restock-requests"),

  createRestockRequest: (data: any): Promise<AxiosResponse<any>> =>
    api.post("/inventory/restock-requests", data),

  updateRestockRequestStatus: (id: string, status: string): Promise<AxiosResponse<any>> =>
    api.patch(`/inventory/restock-requests/${id}/status`, { status }),

  getPurchaseRequests: (): Promise<AxiosResponse<any>> =>
    api.get("/inventory/purchase-requests"),

  updatePurchaseRequestStatus: (id: string, status: string): Promise<AxiosResponse<any>> =>
    api.patch(`/inventory/purchase-requests/${id}/status`, { status }),

  getAutoReorderRules: (): Promise<AxiosResponse<any>> =>
    api.get("/inventory/auto-reorder-rules"),

  createAutoReorderRule: (data: any): Promise<AxiosResponse<any>> =>
    api.post("/inventory/auto-reorder-rules", data),

  runAutoReorderRules: (): Promise<AxiosResponse<any>> =>
    api.post("/inventory/auto-reorder-rules/run"),

  updateAutoReorderRule: (id: string, data: any): Promise<AxiosResponse<any>> =>
    api.patch(`/inventory/auto-reorder-rules/${id}`, data),

  deleteAutoReorderRule: (id: string): Promise<AxiosResponse<any>> =>
    api.delete(`/inventory/auto-reorder-rules/${id}`),

  getAutoReorderStats: (): Promise<AxiosResponse<any>> =>
    api.get("/inventory/auto-reorder-rules/stats"),

  getPurchaseOrders: (): Promise<AxiosResponse<any>> =>
    api.get("/inventory/purchase-orders"),

  updatePurchaseOrderStatus: (id: string, status: string): Promise<AxiosResponse<any>> =>
    api.patch(`/inventory/purchase-orders/${id}/status`, { status }),

  generatePurchaseOrder: (purchaseRequestId: string, data: any): Promise<AxiosResponse<any>> =>
    api.post(`/inventory/purchase-requests/${purchaseRequestId}/generate-po`, data),

  getSuppliers: (): Promise<AxiosResponse<any>> =>
    api.get("/inventory/suppliers"),

  createSupplier: (data: any): Promise<AxiosResponse<any>> =>
    api.post("/inventory/suppliers", data),

  updateSupplier: (id: string, data: any): Promise<AxiosResponse<any>> =>
    api.put(`/inventory/suppliers/${id}`, data),

  deleteSupplier: (id: string): Promise<AxiosResponse<any>> =>
    api.delete(`/inventory/suppliers/${id}`),

  getReturnDashboard: () => api.get("/inventory/returns/dashboard"),

  getReturns: () => api.get("/inventory/returns"),

  createReturn: (data: any) =>
    api.post("/inventory/returns", data),

  updateReturnStatus: (id: string, status: string) =>
    api.patch(`/inventory/returns/${id}/status`, { status }),

  getExecutiveDashboard: () =>
    api.get("/inventory/executive-dashboard"),

  getSupplierPerformance: () =>
    api.get("/inventory/supplier-performance"),
  
  getLeadTimePrediction: () =>
    api.get("/inventory/lead-time-prediction"),

  getForecastSeasonality: (params?: any) =>
    api.get("/inventory/forecast-seasonality", { params }),

  getAiSummary: () => api.get("/inventory/ai-summary"),

  askAiCopilot: (payload: { message: string }) =>
    api.post("/inventory/ai-copilot", payload),

  autonomousOperations: {
    run: () => api.post("/inventory/autonomous/run"),

  getReports: (params) =>
    api.get("/inventory/autonomous/reports", { params }),

  getReport: (id) =>
    api.get(`/inventory/autonomous/reports/${id}`)},
};

// Marketplaces API
export const marketplacesApi = {
  getAll: () => api.get('/marketplaces'),

  getUserAccounts: () => api.get('/marketplaces/accounts'),
  
  getTenantAccounts: () =>
    api.get("/marketplaces/tenant-accounts"),

  connectTenantAccount: (id: string, data: any) =>
    api.post(`/marketplaces/accounts/${id}/connect`, data),

  disconnectTenantAccount: (id: string) =>
    api.post(`/marketplaces/accounts/${id}/disconnect`),  

  getAccountProducts: (id: string, params?: any) =>
    api.get(`/marketplaces/accounts/${id}/products`, { params }),

  connectAccount: (data: any) => api.post('/marketplaces/connect', data),

  disconnectAccount: (id: string) =>
    api.delete(`/marketplaces/accounts/${id}`),

  testConnection: (id: string) =>
    api.post(`/marketplaces/accounts/${id}/test`),
  
  getShopeeOAuthUrl: async () => {
    return api.get("/marketplaces/oauth/shopee/connect"); 
  },
};

// category Mappings Api
export const categoryMappingsApi = {
  getMappings: () => api.get("/category-mappings"),

  getLocalCategories: () =>
    api.get("/category-mappings/local-categories"),

  createMapping: (payload: {
    local_category_id?: string | null;
    local_category_name?: string | null;
    marketplace_code: string;
    marketplace_category_id: string;
    marketplace_category_name: string;
    marketplace_parent_category_id?: string | null;
    marketplace_path?: string | null;
  }) => api.post("/category-mappings", payload),

  updateMapping: (id: string, payload: any) =>
    api.put(`/category-mappings/${id}`, payload),

  deleteMapping: (id: string) =>
    api.delete(`/category-mappings/${id}`),
  
  previewProductMapping: (productId: string, marketplace: string = "SHOPEE") =>
    api.get(`/category-mappings/preview/product/${productId}`, {
      params: { marketplace },
  }),
};

// Analytics API
export const analyticsApi = {
  getDashboard: (params?: any): Promise<AxiosResponse<any>> =>
    api.get('/analytics/dashboard', { params }),
  
  getSalesReport: (params?: any): Promise<AxiosResponse<any>> =>
    api.get('/analytics/sales', { params }),
  
  getInventoryReport: (params?: any): Promise<AxiosResponse<any>> =>
    api.get('/analytics/inventory', { params }),
  
  getMarketplacePerformance: (params?: any): Promise<AxiosResponse<any>> =>
    api.get('/analytics/marketplace-performance', { params }),
}


// Stock Sync API
export const stockSyncApi = {
  getRules: (params?: any) =>
    api.get('/stock-sync/rules', { params }),

  createRule: (rule: any) =>
    api.post('/stock-sync/rules', rule),

  updateRule: (id: string, rule: any) =>
    api.put(`/stock-sync/rules/${id}`, rule),

  deleteRule: (id: string) =>
    api.delete(`/stock-sync/rules/${id}`),

  triggerSync: (productIds: string[], reason?: string) =>
    api.post('/stock-sync/trigger', { productIds, reason }),

  getLogs: (params?: any) =>
    api.get('/stock-sync/logs', { params }),

  retryLog: (id: string) =>
    api.post(`/stock-sync/logs/${id}/retry`),

  getCenter: () =>
    api.get("/stock-sync/center"),

  retryFailedJob: (jobId: string) =>
    api.post(`/stock-sync/center/failed/${encodeURIComponent(jobId)}/retry`),

  removeFailedJob: (jobId: string) =>
    api.delete(`/stock-sync/center/failed/${encodeURIComponent(jobId)}`),

  retryAllFailedJobs: () =>
    api.post("/stock-sync/center/failed/retry-all"),

  clearAllFailedJobs: () =>
    api.delete("/stock-sync/center/failed/clear-all"),

  getStats: (timeRange: string = '24h') =>
    api.get('/stock-sync/stats', { params: { timeRange } }),

  retrySyncLog: (id: string) =>
    api.post(`/stock-sync/logs/${id}/retry`),
  
  };

export const syncCenterApi = {
  getStatus: () =>
    api.get("/sync/stock-sync/status"),

  getLogs: (params?: any) =>
    api.get("/sync/stock-sync/logs", { params }),

  retryFailed: (data?: any) =>
    api.post("/sync/stock-sync/retry-failed", data || {}),
 };

// TAMBAHKAN DI SINI
export const queueApi = {
  getStats: () => api.get("/sync/queue-stats"),

  retryAllFailed: () => api.post("/sync/queue/retry-failed"),

  getAutoSyncJobs: () =>
    api.get("/sync/auto-sync"),

  getCronAnalytics: (timeRange: string = "24h") =>
    api.get("/sync/cron-analytics", { params: { timeRange } }),

  enableAutoSync: (data: {
    marketplaceAccountId: string;
    intervalMinutes: 5 | 15 | 60;
  }) => api.post("/sync/auto-sync", data),

  disableAutoSync: (marketplaceAccountId: string) =>
    api.delete(`/sync/auto-sync/${marketplaceAccountId}`),
};

// Reports API
export const reportsApi = {
  getDashboard: (timeRange?: string): Promise<AxiosResponse<any>> =>
    api.get('/reports/dashboard', { params: { timeRange } }),

  getSalesReport: (params?: any): Promise<AxiosResponse<any>> =>
    api.get('/reports/sales', { params }),

  getProductPerformance: (params?: any): Promise<AxiosResponse<any>> =>
    api.get('/reports/products', { params }),

  getMarketplacePerformance: (params?: any): Promise<AxiosResponse<any>> =>
    api.get('/reports/marketplaces', { params }),

  getInventoryReport: (params?: any): Promise<AxiosResponse<any>> =>
    api.get('/reports/inventory', { params }),

  getFinancialReport: (params?: any): Promise<AxiosResponse<any>> =>
    api.get('/reports/financial', { params })
}

// Sync API
export const syncApi = {
  syncProducts: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/sync/products', data),

  syncOrders: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/sync/orders', data),

  syncInventory: (data: any): Promise<AxiosResponse<any>> =>
    api.post('/sync/inventory', data),

  getStatus: (jobId: string): Promise<AxiosResponse<any>> =>
    api.get(`/sync/status/${jobId}`),

  getLogs: (params?: any): Promise<AxiosResponse<any>> =>
    api.get('/sync/logs', { params }),
}

  export const tenantApi = {
    getBranding: () => api.get("/tenant/branding"),
};

// Setting API
export const settingsApi = {
  getSettings: () => api.get("/settings"),

  updateSettings: (payload: Record<string, any>) =>
    api.put("/settings", payload),
};

export const usersApi = {
  getAll: () => api.get("/users"),

  create: (data: {
    name?: string;
    email: string;
    password: string;
    role: "ADMIN" | "MANAGER" | "STAFF" | "VIEWER";
  }) => api.post("/users", data),

  updateRole: (
    id: string,
    role: "ADMIN" | "MANAGER" | "STAFF" | "VIEWER"
  ) => api.put(`/users/${id}/role`, { role }),

  updateStatus: (
    id: string,
    status: "ACTIVE" | "DISABLED"
  ) => api.put(`/users/${id}/status`, { status }),

  resetPassword: (id: string, password: string) =>
    api.post(`/users/${id}/password`, { password }),
};

export const auditLogsApi = {
  getAll: (params?: {
    limit?: number;
    action?: string;
    entityType?: string;
  }) => api.get("/audit-logs", { params }),
};

export const notificationsApi = {
  getAll: (params?: { limit?: number }) =>
    api.get("/notifications", { params }),

  getUnreadCount: () =>
    api.get("/notifications/unread-count"),

  markRead: (id: string) =>
    api.put(`/notifications/${id}/read`),

  markAllRead: () =>
    api.put("/notifications/read-all"),

  delete: (id: string) => 
    api.delete(`/notifications/${id}`),
};

export const profileApi = {
  getProfile: () => api.get("/profile"),

  updateProfile: (payload: {
    name?: string | null;
    phone?: string | null;
    timezone?: string | null;
    language?: string | null;
    avatar_url?: string | null;
  }) => api.put("/profile", payload),
};

export const SessionAPI = {
  getSessions: () => api.get("/sessions"),

  revokeSession: (id: string) =>
    api.delete(`/sessions/${id}`),

  logoutAll: () =>
    api.post("/sessions/logout-all"),
};

export default api
