export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Seller: undefined;
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
};
