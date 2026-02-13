import { apiClient } from './client';

// ==================== AUTH ====================
export const authApi = {
  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),

  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  }) => apiClient.post('/auth/register', data),

  logout: () => apiClient.post('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),

  getMe: () => apiClient.get('/auth/me'),
};

// ==================== USERS ====================
export const usersApi = {
  getProfile: () => apiClient.get('/users/me'),

  updateProfile: (data: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string }) =>
    apiClient.patch('/users/me', data),

  getAddresses: (userId: string) =>
    apiClient.get(`/users/${userId}/addresses`),

  addAddress: (
    userId: string,
    data: {
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
      zipCode: string;
      label?: string;
      isDefault?: boolean;
      latitude?: number;
      longitude?: number;
    },
  ) => apiClient.post(`/users/${userId}/addresses`, data),

  updateAddress: (userId: string, addressId: string, data: Record<string, unknown>) =>
    apiClient.patch(`/users/${userId}/addresses/${addressId}`, data),

  deleteAddress: (userId: string, addressId: string) =>
    apiClient.delete(`/users/${userId}/addresses/${addressId}`),
};

// ==================== PRODUCTS ====================
export const productsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => apiClient.get('/products', { params }),

  getFeatured: () => apiClient.get('/products/featured'),

  search: (query: string) =>
    apiClient.get('/products/search', { params: { q: query } }),

  getById: (id: string) => apiClient.get(`/products/${id}`),

  getBySlug: (slug: string) => apiClient.get(`/products/slug/${slug}`),

  getByBarcode: (barcode: string) =>
    apiClient.get(`/products/barcode/${barcode}`),
};

// ==================== CATEGORIES ====================
export const categoriesApi = {
  getAll: () => apiClient.get('/categories'),

  getById: (id: string) => apiClient.get(`/categories/${id}`),

  getProducts: (id: string, params?: { page?: number; limit?: number }) =>
    apiClient.get(`/categories/${id}/products`, { params }),
};

// ==================== CART ====================
export const cartApi = {
  get: () => apiClient.get('/cart'),

  addItem: (data: { productId: string; quantity: number }) =>
    apiClient.post('/cart/items', data),

  updateItem: (itemId: string, data: { quantity: number }) =>
    apiClient.patch(`/cart/items/${itemId}`, data),

  removeItem: (itemId: string) => apiClient.delete(`/cart/items/${itemId}`),

  merge: (items: Array<{ productId: string; quantity: number }>) =>
    apiClient.post('/cart/merge', { items }),
};

// ==================== ORDERS ====================
export const ordersApi = {
  create: (data: {
    items: Array<{ productId: string; quantity: number }>;
    fulfillmentType: 'DELIVERY' | 'PICKUP';
    deliveryAddressId?: string;
    couponCode?: string;
    notes?: string;
  }) => apiClient.post('/orders', data),

  getMyOrders: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get('/orders/my-orders', { params }),

  getById: (id: string) => apiClient.get(`/orders/${id}`),

  updateStatus: (id: string, data: { status: string }) =>
    apiClient.patch(`/orders/${id}/status`, data),

  cancel: (id: string, data?: { reason?: string }) =>
    apiClient.post(`/orders/${id}/cancel`, data),

  getTracking: (id: string) => apiClient.get(`/orders/${id}/tracking`),
};

// ==================== REVIEWS ====================
export const reviewsApi = {
  getByProduct: (productId: string) =>
    apiClient.get(`/reviews/product/${productId}`),

  create: (data: {
    productId: string;
    orderId: string;
    rating: number;
    comment?: string;
  }) => apiClient.post('/reviews', data),
};

// ==================== COUPONS ====================
export const couponsApi = {
  validate: (code: string) =>
    apiClient.post('/coupons/validate', { code }),
};

// ==================== LOYALTY ====================
export const loyaltyApi = {
  getPoints: () => apiClient.get('/loyalty/points'),

  getHistory: () => apiClient.get('/loyalty/history'),

  redeem: (data: { points: number; rewardId?: string }) =>
    apiClient.post('/loyalty/redeem', data),

  getRewards: () => apiClient.get('/loyalty/rewards'),
};

// ==================== WISHLIST ====================
export const wishlistApi = {
  get: () => apiClient.get('/wishlist'),

  add: (productId: string) =>
    apiClient.post('/wishlist', { productId }),

  remove: (productId: string) =>
    apiClient.delete(`/wishlist/${productId}`),
};

// ==================== NOTIFICATIONS ====================
export const notificationsApi = {
  getAll: () => apiClient.get('/notifications'),

  markAsRead: (id: string) =>
    apiClient.patch(`/notifications/${id}/read`),

  markAllAsRead: () => apiClient.patch('/notifications/read-all'),
};

// ==================== SELLER ====================
export const sellerApi = {
  // Sales
  createSale: (data: {
    items: Array<{ productId: string; quantity: number; unitPrice: number }>;
    customerId?: string;
    paymentMethod: string;
    paidAmount?: number;
  }) => apiClient.post('/seller/sales', data),

  getSalesHistory: (params?: { page?: number; limit?: number; date?: string }) =>
    apiClient.get('/seller/sales/history', { params }),

  getSuspendedSales: () => apiClient.get('/seller/sales/suspended'),

  suspendSale: (id: string) =>
    apiClient.post(`/seller/sales/${id}/suspend`),

  resumeSale: (id: string) =>
    apiClient.post(`/seller/sales/${id}/resume`),

  deleteSuspendedSale: (id: string) =>
    apiClient.delete(`/seller/sales/suspended/${id}`),

  getStats: () => apiClient.get('/seller/stats'),

  // Customers
  searchCustomers: (query: string) =>
    apiClient.get('/seller/customers/search', { params: { q: query } }),

  quickCreateCustomer: (data: { name: string; phone?: string; cpf?: string }) =>
    apiClient.post('/seller/customers/quick', data),

  // Products (barcode)
  getProductByBarcode: (barcode: string) =>
    apiClient.get(`/seller/products/barcode/${barcode}`),

  // Orders / Picking
  getPendingOrders: () => apiClient.get('/seller/orders/pending'),

  acceptOrder: (orderId: string) =>
    apiClient.post(`/seller/orders/${orderId}/accept`),

  getPickingOrder: (pickingOrderId: string) =>
    apiClient.get(`/seller/picking/${pickingOrderId}`),

  scanPickingItem: (pickingOrderId: string, barcode: string) =>
    apiClient.post(`/seller/picking/${pickingOrderId}/scan`, { barcode }),

  manualPickItem: (pickingItemId: string, notes?: string) =>
    apiClient.post(`/seller/picking/${pickingItemId}/manual-pick`, { notes }),

  getPickingSummary: (pickingOrderId: string) =>
    apiClient.get(`/seller/picking/${pickingOrderId}`),

  completePicking: (pickingOrderId: string) =>
    apiClient.post(`/seller/picking/${pickingOrderId}/complete`),
};

// ==================== DELIVERY ====================
export const deliveryApi = {
  assign: (data: { orderId: string; deliveryPersonId?: string }) =>
    apiClient.post('/delivery/assign', data),

  getActive: () => apiClient.get('/delivery/active'),

  updateLocation: (
    id: string,
    data: { latitude: number; longitude: number },
  ) => apiClient.patch(`/delivery/${id}/location`, data),

  updateStatus: (id: string, data: { status: string }) =>
    apiClient.patch(`/delivery/${id}/status`, data),

  getByOrder: (orderId: string) =>
    apiClient.get(`/delivery/order/${orderId}`),
};
