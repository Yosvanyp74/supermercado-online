import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============ AUTH ============
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
};

// ============ USERS ============
export const usersApi = {
  findAll: (params?: { page?: number; limit?: number; search?: string; role?: string }) =>
    api.get('/users', { params }),
  findOne: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  remove: (id: string) => api.delete(`/users/${id}`),
  getMe: () => api.get('/users/me'),
  updateProfile: (data: any) => api.patch('/users/me', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/users/me/change-password', data),
};

// ============ PRODUCTS ============
export const productsApi = {
  findAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => api.get('/products', { params }),
  findOne: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.patch(`/products/${id}`, data),
  remove: (id: string) => api.delete(`/products/${id}`),
  search: (params: { q: string; page?: number; limit?: number }) =>
    api.get('/products/search', { params }),
  getNextSku: () => api.get('/products/next-sku'),
};

// ============ CATEGORIES ============
export const categoriesApi = {
  findAll: () => api.get('/categories'),
  findOne: (id: string) => api.get(`/categories/${id}`),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.patch(`/categories/${id}`, data),
  remove: (id: string) => api.delete(`/categories/${id}`),
  getProducts: (id: string, params?: { page?: number; limit?: number }) =>
    api.get(`/categories/${id}/products`, { params }),
};

// ============ ORDERS ============
export const ordersApi = {
  findAll: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => api.get('/orders', { params }),
  findOne: (id: string) => api.get(`/orders/${id}`),
  updateStatus: (id: string, data: { status: string; notes?: string }) =>
    api.patch(`/orders/${id}/status`, data),
  cancel: (id: string) => api.post(`/orders/${id}/cancel`),
  getTracking: (id: string) => api.get(`/orders/${id}/tracking`),
  deleteOrder: (id: string) => api.delete(`/orders/${id}`),
};

// ============ INVENTORY ============
export const inventoryApi = {
  getInventory: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    lowStock?: boolean;
  }) => api.get('/inventory', { params }),
  getLowStock: () => api.get('/inventory/low-stock'),
  getMovements: (params?: {
    page?: number;
    limit?: number;
    productId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/inventory/movements', { params }),
  createMovement: (data: {
    productId: string;
    type: string;
    quantity: number;
    reason?: string;
  }) => api.post('/inventory/movements', data),
  getStock: (productId: string) => api.get(`/inventory/${productId}`),
  adjustStock: (data: { productId: string; quantity: number; reason: string }) =>
    api.post('/inventory/adjust', data),
};

// ============ DELIVERY ============
export const deliveryApi = {
  assign: (data: { orderId: string; deliveryPersonId: string }) =>
    api.post('/delivery/assign', data),
  getActive: () => api.get('/delivery/active'),
  updateStatus: (id: string, data: { status: string; failureReason?: string }) =>
    api.patch(`/delivery/${id}/status`, data),
  getByOrder: (orderId: string) => api.get(`/delivery/order/${orderId}`),
};

// ============ REVIEWS ============
export const reviewsApi = {
  findAll: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/reviews', { params }),
  findByProduct: (productId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/reviews/product/${productId}`, { params }),
  approve: (id: string) => api.patch(`/reviews/${id}/approve`),
  remove: (id: string) => api.delete(`/reviews/${id}`),
};

// ============ COUPONS ============
export const couponsApi = {
  findAll: (params?: { page?: number; limit?: number }) =>
    api.get('/coupons', { params }),
  create: (data: any) => api.post('/coupons', data),
  update: (id: string, data: any) => api.patch(`/coupons/${id}`, data),
  remove: (id: string) => api.delete(`/coupons/${id}`),
};

// ============ ANALYTICS ============
export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getSales: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/analytics/sales', { params }),
  getTopProducts: (params?: { startDate?: string; endDate?: string; limit?: number }) =>
    api.get('/analytics/products', { params }),
  getCustomerAnalytics: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/analytics/customers', { params }),
  getRevenueByDay: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/analytics/revenue', { params }),
  getSellerPerformance: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/analytics/sellers', { params }),
  getMarginDashboard: () => api.get('/analytics/margin'),
};

// ============ SELLER ==========
export const sellerApi = {
  getStats: () => api.get('/seller/stats'),
  getPendingOrders: (params?: { limit?: number }) =>
    api.get('/seller/orders/pending', { params }),
  getOrders: (params?: { filter?: 'all' | 'pending' | 'picking' }) =>
    api.get('/seller/orders', { params }),
  getMyPickingOrders: () => api.get('/seller/picking'),
  acceptOrder: (orderId: string) => api.post(`/seller/orders/${orderId}/accept`),
  // further seller endpoints can be added here
};

// ============ NOTIFICATIONS ============
export const notificationsApi = {
  findAll: (params?: { page?: number; limit?: number; isRead?: boolean }) =>
    api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};

// ============ SUPPLIERS ============
export const suppliersApi = {
  findAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/suppliers', { params }),
  findOne: (id: string) => api.get(`/suppliers/${id}`),
  create: (data: any) => api.post('/suppliers', data),
  update: (id: string, data: any) => api.patch(`/suppliers/${id}`, data),
  remove: (id: string) => api.delete(`/suppliers/${id}`),
  getPurchaseOrders: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/suppliers/purchase-orders', { params }),
  createPurchaseOrder: (data: any) => api.post('/suppliers/purchase-orders', data),
  receivePurchaseOrder: (id: string) =>
    api.patch(`/suppliers/purchase-orders/${id}/receive`),
};
