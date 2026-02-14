export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Seller: undefined;
  Admin: undefined;
  Delivery: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  CategoriesTab: undefined;
  CartTab: undefined;
  OrdersTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  ProductList: { categoryId?: string; search?: string; title?: string };
  ProductDetail: { productId: string };
  Search: undefined;
};

export type CategoriesStackParamList = {
  Categories: undefined;
  CategoryProducts: { categoryId: string; categoryName: string };
  ProductDetail: { productId: string };
};

export type CartStackParamList = {
  Cart: undefined;
  Checkout: undefined;
};

export type OrdersStackParamList = {
  Orders: undefined;
  OrderDetail: { orderId: string };
  TrackOrder: { orderId: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  Addresses: undefined;
  AddAddress: { address?: any };
  Wishlist: undefined;
  Loyalty: undefined;
  Notifications: undefined;
  Settings: undefined;
};

export type SellerStackParamList = {
  SellerHome: undefined;
  ProductScanner: undefined;
  ActiveSale: undefined;
  CustomerSearch: undefined;
  Payment: undefined;
  PaymentSuccess: {
    saleId: string;
    total: number;
    paymentMethod: string;
    change?: number;
  };
  SalesHistory: undefined;
  SuspendedSales: undefined;
  OrderQueue: undefined;
  OrderPicking: { pickingOrderId: string };
  BarcodeScannerPicking: {
    pickingOrderId: string;
    pickingItemId: string;
    expectedBarcode?: string;
    productName: string;
  };
  ManualItemPick: {
    pickingOrderId: string;
    pickingItemId: string;
    productName: string;
    quantity: number;
  };
  OrderCompletion: { pickingOrderId: string };
  ReadyForDelivery: undefined;
};

export type DeliveryStackParamList = {
  DeliveryHome: undefined;
  DeliveryActive: undefined;
  DeliveryDetail: { deliveryId: string };
  DeliveryHistory: undefined;
  DeliveryProfile: undefined;
};

export type AdminStackParamList = {
  AdminHome: undefined;
  AdminProducts: undefined;
  AdminProductForm: { productId?: string };
  AdminCategories: undefined;
  AdminCategoryForm: { categoryId?: string };
  AdminOrders: undefined;
  AdminOrderDetail: { orderId: string };
  AdminUsers: undefined;
  AdminUserDetail: { userId: string };
  AdminInventory: undefined;
  AdminInventoryAdjust: { productId: string; productName: string; currentStock: number };
  AdminCoupons: undefined;
  AdminCouponForm: { couponId?: string };
  AdminAnalytics: undefined;
  AdminDeliveries: undefined;
  AdminDeliveryDetail: { orderId: string };
  AdminSuppliers: undefined;
  AdminSupplierForm: { supplierId?: string };
  AdminPurchaseOrders: undefined;
  AdminReviews: undefined;
  AdminNotifications: undefined;
  AdminSettings: undefined;
};
