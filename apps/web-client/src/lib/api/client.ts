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
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// ============ AUTH ============
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    cpf?: string;
  }) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
};

// ============ USERS ============
export const usersApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string;
  }) => api.patch('/users/me', data),
  update: (id: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string;
  }) => api.patch(`/users/${id}`, data),
  getAddresses: (id: string) => api.get(`/users/${id}/addresses`),
  createAddress: (id: string, data: {
    label: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    latitude?: number;
    longitude?: number;
    isDefault?: boolean;
  }) => api.post(`/users/${id}/addresses`, data),
  updateAddress: (id: string, addressId: string, data: Record<string, any>) =>
    api.patch(`/users/${id}/addresses/${addressId}`, data),
  deleteAddress: (id: string, addressId: string) =>
    api.delete(`/users/${id}/addresses/${addressId}`),
};

// ============ UPLOADS ============
export const uploadsApi = {
  uploadImage: (file: File, folder?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/uploads/image${folder ? `?folder=${folder}` : ''}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ============ PRODUCTS ============
export const productsApi = {
  findAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
    isFeatured?: boolean;
    isOrganic?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => api.get('/products', { params }),
  findOne: (id: string) => api.get(`/products/${id}`),
  findBySlug: (slug: string) => api.get(`/products/slug/${slug}`),
  findFeatured: (limit?: number) =>
    api.get('/products/featured', { params: { limit } }),
  search: (q: string, page?: number, limit?: number) =>
    api.get('/products/search', { params: { q, page, limit } }),
};

// ============ CATEGORIES ============
export const categoriesApi = {
  findAll: () => api.get('/categories'),
  findOne: (id: string) => api.get(`/categories/${id}`),
  getProducts: (id: string, params?: { page?: number; limit?: number }) =>
    api.get(`/categories/${id}/products`, { params }),
};

// ============ CART ============
export const cartApi = {
  getCart: () => api.get('/cart'),
  addItem: (data: { productId: string; quantity: number }) =>
    api.post('/cart/items', data),
  updateItem: (itemId: string, data: { quantity: number }) =>
    api.patch(`/cart/items/${itemId}`, data),
  removeItem: (itemId: string) => api.delete(`/cart/items/${itemId}`),
  clearCart: () => api.delete('/cart'),
  mergeGuestCart: () => api.post('/cart/merge'),
};

// ============ ORDERS ============
export const ordersApi = {
  create: (data: {
    items: { productId: string; quantity: number; notes?: string }[];
    fulfillmentType: 'DELIVERY' | 'PICKUP';
    deliveryAddressId?: string;
    couponCode?: string;
    notes?: string;
  }) => api.post('/orders', data),
  findMyOrders: (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => api.get('/orders/my-orders', { params }),
  findOne: (id: string) => api.get(`/orders/${id}`),
  cancel: (id: string) => api.post(`/orders/${id}/cancel`),
  getTracking: (id: string) => api.get(`/orders/${id}/tracking`),
};

// ============ REVIEWS ============
export const reviewsApi = {
  create: (data: {
    productId: string;
    rating: number;
    title?: string;
    comment?: string;
    images?: string[];
  }) => api.post('/reviews', data),
  findByProduct: (productId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/reviews/product/${productId}`, { params }),
  getReviewSummary: (productId: string) =>
    api.get(`/reviews/product/${productId}/summary`),
  update: (id: string, data: any) => api.patch(`/reviews/${id}`, data),
  remove: (id: string) => api.delete(`/reviews/${id}`),
};

// ============ COUPONS ============
export const couponsApi = {
  validate: (data: { code: string; orderTotal: number }) =>
    api.post('/coupons/validate', data),
};

// ============ LOYALTY ============
export const loyaltyApi = {
  getAccount: () => api.get('/loyalty/points'),
  getTransactions: (params?: { page?: number; limit?: number }) =>
    api.get('/loyalty/history', { params }),
  redeemPoints: (rewardId: string) =>
    api.post('/loyalty/redeem', { rewardId }),
  getRewards: () => api.get('/loyalty/rewards'),
};

// ============ WISHLIST ============
export const wishlistApi = {
  getWishlist: () => api.get('/wishlist'),
  toggleItem: (productId: string) => api.post(`/wishlist/${productId}`),
  removeItem: (productId: string) => api.delete(`/wishlist/${productId}`),
  isInWishlist: (productId: string) =>
    api.get(`/wishlist/${productId}/check`),
};

// ============ NOTIFICATIONS ============
export const notificationsApi = {
  findAll: (params?: { page?: number; limit?: number; isRead?: boolean }) =>
    api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  getPreferences: () => api.get('/notifications/preferences'),
  updatePreferences: (data: {
    orderUpdates?: boolean;
    promotions?: boolean;
    deliveryUpdates?: boolean;
    loyaltyUpdates?: boolean;
    pushEnabled?: boolean;
    emailEnabled?: boolean;
    smsEnabled?: boolean;
  }) => api.patch('/notifications/preferences', data),
};

// ============ DELIVERY ============
export const deliveryApi = {
  getByOrder: (orderId: string) => api.get(`/delivery/order/${orderId}`),
  rateDelivery: (id: string, data: { rating: number; comment?: string }) =>
    api.post(`/delivery/${id}/rate`, data),
};
