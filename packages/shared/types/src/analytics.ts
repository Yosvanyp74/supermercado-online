export interface SalesDashboard {
  todaySales: number;
  todayOrders: number;
  averageTicket: number;
  itemsSold: number;
  goalProgress: number;
  salesByHour: { hour: number; total: number; count: number }[];
  topProducts: { productId: string; name: string; quantity: number; total: number }[];
  revenueByMethod: { method: string; total: number; count: number }[];
}

export interface AdminDashboard {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  revenueByDay: { date: string; total: number }[];
  ordersByStatus: { status: string; count: number }[];
  topSellingProducts: { productId: string; name: string; quantity: number; revenue: number }[];
  lowStockProducts: { productId: string; name: string; stock: number; minStock: number }[];
  recentOrders: { id: string; orderNumber: string; total: number; status: string; createdAt: Date }[];
  sellerPerformance: { sellerId: string; name: string; totalSales: number; orderCount: number }[];
}

export interface AnalyticsQuery {
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'week' | 'month';
}

export interface SalesReport {
  period: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
  topCategories: { name: string; quantity: number; revenue: number }[];
  paymentMethodBreakdown: { method: string; total: number; percentage: number }[];
  channelBreakdown: { channel: string; total: number; percentage: number }[];
}
