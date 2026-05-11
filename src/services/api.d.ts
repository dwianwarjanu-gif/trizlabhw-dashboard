import { LoginCredentials, RegisterData, AuthResponse, RefreshTokenResponse } from '@/types/auth';
declare const api: import("axios").AxiosInstance;
export declare const authApi: {
    login: (credentials: LoginCredentials) => Promise<AxiosResponse<AuthResponse>>;
    register: (data: RegisterData) => Promise<AxiosResponse<{
        message: string;
    }>>;
    logout: () => Promise<AxiosResponse<{
        message: string;
    }>>;
    getProfile: () => Promise<AxiosResponse<{
        user: any;
    }>>;
    refreshToken: () => Promise<AxiosResponse<RefreshTokenResponse>>;
};
export declare const productsApi: {
    getAll: (params?: any) => Promise<AxiosResponse<any>>;
    getById: (id: string) => Promise<AxiosResponse<any>>;
    create: (data: any) => Promise<AxiosResponse<any>>;
    update: (id: string, data: any) => Promise<AxiosResponse<any>>;
    delete: (id: string) => Promise<AxiosResponse<any>>;
    bulkSync: (data: any) => Promise<AxiosResponse<any>>;
};
export declare const ordersApi: {
    getAll: (params?: any) => Promise<AxiosResponse<any>>;
    getById: (id: string) => Promise<AxiosResponse<any>>;
    updateStatus: (id: string, status: string, reason?: string, updateMarketplace?: boolean) => Promise<AxiosResponse<any>>;
    assignOrder: (id: string, userId: string, reason?: string) => Promise<AxiosResponse<any>>;
    addTag: (id: string, tag: string) => Promise<AxiosResponse<any>>;
    removeTag: (id: string, tagId: string) => Promise<AxiosResponse<any>>;
    sync: (marketplaceAccountId: string, options?: any) => Promise<AxiosResponse<any>>;
    getStats: (timeRange?: string) => Promise<AxiosResponse<any>>;
};
export declare const inventoryApi: {
    getAll: (params?: any) => Promise<AxiosResponse<any>>;
    updateStock: (productId: string, data: any) => Promise<AxiosResponse<any>>;
    getLowStock: () => Promise<AxiosResponse<any>>;
    getMovements: (productId: string) => Promise<AxiosResponse<any>>;
};
export declare const marketplacesApi: {
    getAll: () => Promise<AxiosResponse<any>>;
    getUserAccounts: () => Promise<AxiosResponse<any>>;
    connectAccount: (data: any) => Promise<AxiosResponse<any>>;
    disconnectAccount: (id: string) => Promise<AxiosResponse<any>>;
    testConnection: (id: string) => Promise<AxiosResponse<any>>;
};
export declare const analyticsApi: {
    getDashboard: (params?: any) => Promise<AxiosResponse<any>>;
    getSalesReport: (params?: any) => Promise<AxiosResponse<any>>;
    getInventoryReport: (params?: any) => Promise<AxiosResponse<any>>;
    getMarketplacePerformance: (params?: any) => Promise<AxiosResponse<any>>;
};
export declare const stockSyncApi: {
    getRules: (params?: any) => Promise<AxiosResponse<any>>;
    createRule: (rule: any) => Promise<AxiosResponse<any>>;
    updateRule: (id: string, rule: any) => Promise<AxiosResponse<any>>;
    deleteRule: (id: string) => Promise<AxiosResponse<any>>;
    triggerSync: (productIds: string[], reason?: string) => Promise<AxiosResponse<any>>;
    getLogs: (params?: any) => Promise<AxiosResponse<any>>;
    getStats: (timeRange?: string) => Promise<AxiosResponse<any>>;
};
export declare const reportsApi: {
    getDashboard: (timeRange?: string) => Promise<AxiosResponse<any>>;
    getSalesReport: (params?: any) => Promise<AxiosResponse<any>>;
    getProductPerformance: (params?: any) => Promise<AxiosResponse<any>>;
    getMarketplacePerformance: (params?: any) => Promise<AxiosResponse<any>>;
    getInventoryReport: (params?: any) => Promise<AxiosResponse<any>>;
    getFinancialReport: (params?: any) => Promise<AxiosResponse<any>>;
};
export declare const syncApi: {
    syncProducts: (data: any) => Promise<AxiosResponse<any>>;
    syncOrders: (data: any) => Promise<AxiosResponse<any>>;
    syncInventory: (data: any) => Promise<AxiosResponse<any>>;
    getStatus: (jobId: string) => Promise<AxiosResponse<any>>;
    getLogs: (params?: any) => Promise<AxiosResponse<any>>;
};
export default api;
//# sourceMappingURL=api.d.ts.map