import axios from 'axios';
import toast from 'react-hot-toast';
import { LoginCredentials, RegisterData, AuthResponse, RefreshTokenResponse } from '@/types/auth';
// Create axios instance
export const api = axios.create({
  baseURL: "https://api.trizlabhw.com/api"
});

api.interceptors.request.use((config) => {
  const tenant = window.location.hostname.split(".")[0];

  if (tenant) {
    config.headers["x-tenant"] = tenant;
  }

  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  return config;
});
// Response interceptor for error handling
api.interceptors.response.use((response) => response, async (error) => {
    const originalRequest = error.config;
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
            // Try to refresh token
            const refreshResponse = await api.post('/auth/refresh');
            const { token } = refreshResponse.data;
            localStorage.setItem('auth_token', token);
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
        }
        catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            window.location.href = '/login';
            return Promise.reject(refreshError);
        }
    }
    // Handle other errors
    if (error.response?.status >= 500) {
        toast.error('Terjadi kesalahan server. Silakan coba lagi.');
    }
    else if (error.response?.status === 403) {
        toast.error('Anda tidak memiliki akses untuk melakukan tindakan ini.');
    }
    else if (error.response?.status === 404) {
        toast.error('Data yang diminta tidak ditemukan.');
    }
    else if (error.code === 'ECONNABORTED') {
        toast.error('Koneksi timeout. Silakan coba lagi.');
    }
    else if (!error.response) {
        toast.error('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
    }
    return Promise.reject(error);
});
// Auth API
export const authApi = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (data) => api.post('/auth/register', data),
    logout: () => api.post('/auth/logout'),
    getProfile: () => api.get('/auth/me'),
    refreshToken: () => api.post('/auth/refresh'),
};
// Products API
export const productsApi = {
    getAll: (params) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
    bulkSync: (data) => api.post('/products/bulk-sync', data),
};
// Orders API
export const ordersApi = {
    getAll: (params) => api.get('/orders', { params }),
    getById: (id) => api.get(`/orders/${id}`),
    updateStatus: (id, status, reason, updateMarketplace) => api.patch(`/orders/${id}/status`, { status, reason, updateMarketplace }),
    assignOrder: (id, userId, reason) => api.patch(`/orders/${id}/assign`, { assignedUserId: userId, reason }),
    addTag: (id, tag) => api.post(`/orders/${id}/tags`, { tag }),
    removeTag: (id, tagId) => api.delete(`/orders/${id}/tags/${tagId}`),
    sync: (marketplaceAccountId, options) => api.post(`/order-management/sync`, { marketplaceAccountId, ...options }),
    getStats: (timeRange) => api.get('/order-management/stats', { params: { timeRange } }),
};
// Inventory API
export const inventoryApi = {
    getAll: (params) => api.get('/inventory', { params }),
    updateStock: (productId, data) => api.patch(`/inventory/${productId}`, data),
    getLowStock: () => api.get('/inventory/low-stock'),
    getMovements: (productId) => api.get(`/inventory/${productId}/movements`),
};
// Marketplaces API
export const marketplacesApi = {
    getAll: () => api.get('/marketplaces'),
    getUserAccounts: () => api.get('/marketplaces/accounts'),
    connectAccount: (data) => api.post('/marketplaces/connect', data),
    disconnectAccount: (id) => api.delete(`/marketplaces/accounts/${id}`),
    testConnection: (id) => api.post(`/marketplaces/accounts/${id}/test`),
};
// Analytics API
export const analyticsApi = {
    getDashboard: (params) => api.get('/analytics/dashboard', { params }),
    getSalesReport: (params) => api.get('/analytics/sales', { params }),
    getInventoryReport: (params) => api.get('/analytics/inventory', { params }),
    getMarketplacePerformance: (params) => api.get('/analytics/marketplace-performance', { params }),
};
// Stock Sync API
export const stockSyncApi = {
    getRules: (params) => api.get('/stock-sync/rules', { params }),
    createRule: (rule) => api.post('/stock-sync/rules', rule),
    updateRule: (id, rule) => api.put(`/stock-sync/rules/${id}`, rule),
    deleteRule: (id) => api.delete(`/stock-sync/rules/${id}`),
    triggerSync: (productIds, reason) => api.post('/stock-sync/trigger', { productIds, reason }),
    getLogs: (params) => api.get('/stock-sync/logs', { params }),
    getStats: (timeRange = '24h') => api.get('/stock-sync/stats', { params: { timeRange } })
};
// Reports API
export const reportsApi = {
    getDashboard: (timeRange) => api.get('/reports/dashboard', { params: { timeRange } }),
    getSalesReport: (params) => api.get('/reports/sales', { params }),
    getProductPerformance: (params) => api.get('/reports/products', { params }),
    getMarketplacePerformance: (params) => api.get('/reports/marketplaces', { params }),
    getInventoryReport: (params) => api.get('/reports/inventory', { params }),
    getFinancialReport: (params) => api.get('/reports/financial', { params })
};
// Sync API
export const syncApi = {
    syncProducts: (data) => api.post('/sync/products', data),
    syncOrders: (data) => api.post('/sync/orders', data),
    syncInventory: (data) => api.post('/sync/inventory', data),
    getStatus: (jobId) => api.get(`/sync/status/${jobId}`),
    getLogs: (params) => api.get('/sync/logs', { params }),
};
export default api;
//# sourceMappingURL=api.js.map