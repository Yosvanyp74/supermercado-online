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

// ==================== ADMIN ====================
export const adminApi = {
  // Analytics / Dashboard
  getDashboard: () => apiClient.get('/analytics/dashboard'),

  getSalesAnalytics: (params?: { startDate?: string; endDate?: string }) =>
    apiClient.get('/analytics/sales', { params }),

  getTopProducts: (params?: { startDate?: string; endDate?: string; limit?: number }) =>
    apiClient.get('/analytics/products', { params }),

  getCustomerAnalytics: (params?: { startDate?: string; endDate?: string }) =>
    apiClient.get('/analytics/customers', { params }),

  getRevenueByDay: (params?: { startDate?: string; endDate?: string }) =>
    apiClient.get('/analytics/revenue', { params }),

  // Products (admin CRUD)
  getProducts: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => apiClient.get('/products', { params }),

  createProduct: (data: Record<string, unknown>) =>
    apiClient.post('/products', data),

  updateProduct: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/products/${id}`, data),

  deleteProduct: (id: string) =>
    apiClient.delete(`/products/${id}`),

  // Categories (admin CRUD)
  getCategories: () => apiClient.get('/categories'),

  createCategory: (data: { name: string; description?: string; imageUrl?: string; parentId?: string }) =>
    apiClient.post('/categories', data),

  updateCategory: (id: string, data: { name?: string; description?: string; imageUrl?: string }) =>
    apiClient.patch(`/categories/${id}`, data),

  deleteCategory: (id: string) =>
    apiClient.delete(`/categories/${id}`),

  // Orders (admin management)
  getOrders: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => apiClient.get('/orders', { params }),

  getOrder: (id: string) => apiClient.get(`/orders/${id}`),

  updateOrderStatus: (id: string, data: { status: string }) =>
    apiClient.patch(`/orders/${id}/status`, data),

  // Users (admin management)
  getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string }) =>
    apiClient.get('/users', { params }),

  getUser: (id: string) => apiClient.get(`/users/${id}`),

  updateUser: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/users/${id}`, data),

  deleteUser: (id: string) =>
    apiClient.delete(`/users/${id}`),

  // Inventory
  getInventory: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    lowStock?: boolean;
  }) => apiClient.get('/inventory', { params }),

  getLowStock: () => apiClient.get('/inventory/low-stock'),

  getStock: (productId: string) =>
    apiClient.get(`/inventory/${productId}`),

  adjustStock: (data: { productId: string; quantity: number; reason: string }) =>
    apiClient.post('/inventory/adjust', data),

  createMovement: (data: { productId: string; type: string; quantity: number; reason?: string }) =>
    apiClient.post('/inventory/movements', data),

  getMovements: (params?: {
    page?: number;
    limit?: number;
    productId?: string;
    type?: string;
  }) => apiClient.get('/inventory/movements', { params }),

  // Coupons
  getCoupons: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/coupons', { params }),

  createCoupon: (data: Record<string, unknown>) =>
    apiClient.post('/coupons', data),

  updateCoupon: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/coupons/${id}`, data),

  deleteCoupon: (id: string) =>
    apiClient.delete(`/coupons/${id}`),

  // Uploads
  uploadImage: (formData: FormData) =>
    apiClient.post('/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Analytics (extended)
  getSellerPerformance: (params?: { startDate?: string; endDate?: string }) =>
    apiClient.get('/analytics/sellers', { params }),

  // Delivery management
  getDeliveries: () => apiClient.get('/delivery/active'),
  assignDelivery: (data: { orderId: string; deliveryPersonId: string }) =>
    apiClient.post('/delivery/assign', data),
  getDeliveryByOrder: (orderId: string) =>
    apiClient.get(`/delivery/order/${orderId}`),
  updateDeliveryStatus: (id: string, data: { status: string }) =>
    apiClient.patch(`/delivery/${id}/status`, data),

  // Suppliers
  getSuppliers: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get('/suppliers', { params }),
  getSupplier: (id: string) => apiClient.get(`/suppliers/${id}`),
  createSupplier: (data: Record<string, unknown>) =>
    apiClient.post('/suppliers', data),
  updateSupplier: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/suppliers/${id}`, data),
  deleteSupplier: (id: string) =>
    apiClient.delete(`/suppliers/${id}`),
  getPurchaseOrders: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get('/suppliers/purchase-orders', { params }),
  createPurchaseOrder: (data: Record<string, unknown>) =>
    apiClient.post('/suppliers/purchase-orders', data),
  receivePurchaseOrder: (id: string) =>
    apiClient.patch(`/suppliers/purchase-orders/${id}/receive`),

  // Reviews (admin moderation)
  getReviews: (productId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get(`/reviews/product/${productId}`, { params }),
  approveReview: (id: string) =>
    apiClient.patch(`/reviews/${id}/approve`),
  deleteReview: (id: string) =>
    apiClient.delete(`/reviews/${id}`),

  // Notifications (admin)
  getNotifications: (params?: { page?: number; limit?: number; isRead?: boolean }) =>
    apiClient.get('/notifications', { params }),
  getUnreadCount: () =>
    apiClient.get('/notifications/unread-count'),
  markNotificationRead: (id: string) =>
    apiClient.patch(`/notifications/${id}/read`),
  markAllNotificationsRead: () =>
    apiClient.patch('/notifications/read-all'),
  getNotificationPreferences: () =>
    apiClient.get('/notifications/preferences'),
  updateNotificationPreferences: (data: Record<string, unknown>) =>
    apiClient.patch('/notifications/preferences', data),
};
