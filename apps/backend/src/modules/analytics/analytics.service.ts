import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getSalesDashboard(params: { startDate?: string; endDate?: string }) {
    const where = this.buildDateFilter(params.startDate, params.endDate);

    const orders = await this.prisma.order.findMany({
      where: { ...where, status: { not: 'CANCELLED' } },
      select: { total: true, createdAt: true },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      averageTicket: Math.round(averageTicket * 100) / 100,
    };
  }

  async getTopProducts(params: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) {
    const limit = params.limit || 10;
    const dateFilter = this.buildDateFilter(params.startDate, params.endDate);

    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: { ...dateFilter, status: { not: 'CANCELLED' } },
      },
      select: {
        productId: true,
        productName: true,
        productImage: true,
        quantity: true,
        total: true,
      },
    });

    const productMap = new Map<
      string,
      { productId: string; name: string; image: string | null; totalSold: number; revenue: number }
    >();

    for (const item of orderItems) {
      const existing = productMap.get(item.productId);
      if (existing) {
        existing.totalSold += item.quantity;
        existing.revenue += item.total;
      } else {
        productMap.set(item.productId, {
          productId: item.productId,
          name: item.productName,
          image: item.productImage,
          totalSold: item.quantity,
          revenue: item.total,
        });
      }
    }

    const products = Array.from(productMap.values())
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, limit);

    return products.map((p) => ({
      ...p,
      revenue: Math.round(p.revenue * 100) / 100,
    }));
  }

  async getCustomerAnalytics(params: { startDate?: string; endDate?: string }) {
    const dateFilter = this.buildDateFilter(params.startDate, params.endDate);

    const [totalCustomers, newCustomers, customersWithOrders] =
      await this.prisma.$transaction([
        this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
        this.prisma.user.count({
          where: { role: 'CUSTOMER', ...this.buildUserDateFilter(params.startDate, params.endDate) },
        }),
        this.prisma.user.count({
          where: {
            role: 'CUSTOMER',
            orders: { some: { ...dateFilter, status: { not: 'CANCELLED' } } },
          },
        }),
      ]);

    return {
      totalCustomers,
      newCustomers,
      activeCustomers: customersWithOrders,
      returningCustomers: Math.max(0, customersWithOrders - newCustomers),
    };
  }

  async getRevenueByDay(params: { startDate?: string; endDate?: string }) {
    const dateFilter = this.buildDateFilter(params.startDate, params.endDate);

    const orders = await this.prisma.order.findMany({
      where: { ...dateFilter, status: { not: 'CANCELLED' } },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const dailyMap = new Map<string, number>();

    for (const order of orders) {
      const day = order.createdAt.toISOString().split('T')[0];
      dailyMap.set(day, (dailyMap.get(day) || 0) + order.total);
    }

    return Array.from(dailyMap.entries()).map(([date, revenue]) => ({
      date,
      revenue: Math.round(revenue * 100) / 100,
    }));
  }

  async getSellerPerformance(params: { startDate?: string; endDate?: string }) {
    const dateFilter = this.buildDateFilter(params.startDate, params.endDate);

    const sales = await this.prisma.sale.findMany({
      where: dateFilter,
      select: {
        sellerId: true,
        total: true,
        seller: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    const sellerMap = new Map<
      string,
      { sellerId: string; name: string; totalSales: number; revenue: number }
    >();

    for (const sale of sales) {
      const existing = sellerMap.get(sale.sellerId);
      if (existing) {
        existing.totalSales++;
        existing.revenue += sale.total;
      } else {
        sellerMap.set(sale.sellerId, {
          sellerId: sale.sellerId,
          name: `${sale.seller.firstName} ${sale.seller.lastName}`,
          totalSales: 1,
          revenue: sale.total,
        });
      }
    }

    return Array.from(sellerMap.values())
      .map((s) => ({
        ...s,
        revenue: Math.round(s.revenue * 100) / 100,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  async getAdminDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalProducts,
      totalOrders,
      totalCustomers,
      pendingOrders,
      todayOrders,
      lowStockProducts,
    ] = await this.prisma.$transaction([
      this.prisma.product.count({ where: { status: 'ACTIVE' } }),
      this.prisma.order.count(),
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.order.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.product.count({
        where: {
          status: 'ACTIVE',
          stock: { lte: this.prisma.product.fields?.minStock as any || 5 },
        },
      }),
    ]);

    const todaySales = await this.prisma.order.aggregate({
      where: { createdAt: { gte: today }, status: { not: 'CANCELLED' } },
      _sum: { total: true },
    });

    return {
      totalProducts,
      totalOrders,
      totalCustomers,
      pendingOrders,
      todayOrders,
      todayRevenue: Math.round((todaySales._sum.total || 0) * 100) / 100,
      lowStockProducts,
    };
  }

  private buildDateFilter(startDate?: string, endDate?: string) {
    const filter: any = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.gte = new Date(startDate);
      if (endDate) filter.createdAt.lte = new Date(endDate);
    }

    return filter;
  }

  private buildUserDateFilter(startDate?: string, endDate?: string) {
    const filter: any = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.gte = new Date(startDate);
      if (endDate) filter.createdAt.lte = new Date(endDate);
    }

    return filter;
  }

  // ============ MARGIN ANALYTICS ============

  async getMarginDashboard() {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const notCancelled = { status: { notIn: ['CANCELLED', 'REFUNDED'] as any } };

    // Today's margin
    const todayOrders = await this.prisma.order.findMany({
      where: { createdAt: { gte: todayStart }, ...notCancelled },
      select: {
        orderTotalCost: true,
        orderTotalRevenue: true,
        orderGrossMarginAmount: true,
        total: true,
      },
    });

    const todayRevenue = todayOrders.reduce((s, o) => s + (o.orderTotalRevenue || o.total || 0), 0);
    const todayCost = todayOrders.reduce((s, o) => s + (o.orderTotalCost || 0), 0);
    const todayMarginAmount = Math.round((todayRevenue - todayCost) * 100) / 100;
    const todayMarginPercent = todayRevenue > 0
      ? Math.round((todayMarginAmount / todayRevenue) * 10000) / 10000
      : 0;

    // Week's margin
    const weekOrders = await this.prisma.order.findMany({
      where: { createdAt: { gte: weekStart }, ...notCancelled },
      select: {
        orderTotalCost: true,
        orderTotalRevenue: true,
        total: true,
        createdAt: true,
      },
    });

    const weekRevenue = weekOrders.reduce((s, o) => s + (o.orderTotalRevenue || o.total || 0), 0);
    const weekCost = weekOrders.reduce((s, o) => s + (o.orderTotalCost || 0), 0);
    const weekMarginAmount = Math.round((weekRevenue - weekCost) * 100) / 100;
    const weekMarginPercent = weekRevenue > 0
      ? Math.round((weekMarginAmount / weekRevenue) * 10000) / 10000
      : 0;

    // Daily trend (last 7 days)
    const dailyTrend: { date: string; revenue: number; cost: number; margin: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayOrders = weekOrders.filter(
        (o) => o.createdAt >= dayStart && o.createdAt <= dayEnd,
      );

      const dayRevenue = dayOrders.reduce((s, o) => s + (o.orderTotalRevenue || o.total || 0), 0);
      const dayCost = dayOrders.reduce((s, o) => s + (o.orderTotalCost || 0), 0);

      dailyTrend.push({
        date: dayStart.toISOString().split('T')[0],
        revenue: Math.round(dayRevenue * 100) / 100,
        cost: Math.round(dayCost * 100) / 100,
        margin: Math.round((dayRevenue - dayCost) * 100) / 100,
      });
    }

    return {
      today: {
        revenue: Math.round(todayRevenue * 100) / 100,
        cost: Math.round(todayCost * 100) / 100,
        marginAmount: todayMarginAmount,
        marginPercent: todayMarginPercent,
        orderCount: todayOrders.length,
      },
      week: {
        revenue: Math.round(weekRevenue * 100) / 100,
        cost: Math.round(weekCost * 100) / 100,
        marginAmount: weekMarginAmount,
        marginPercent: weekMarginPercent,
        orderCount: weekOrders.length,
      },
      dailyTrend,
    };
  }
}
