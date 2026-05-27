import { db } from "@/lib/db";
import { cache, CACHE_TTL } from "@/lib/api/cache";

const DASHBOARD_CACHE_KEY = "analytics:dashboard";

export class AnalyticsService {
  static async getDashboard(skipCache = false) {
    if (!skipCache) {
      const cached = cache.get<DashboardData>(DASHBOARD_CACHE_KEY);
      if (cached) return cached;
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersThisMonth,
      totalOrders,
      ordersThisMonth,
      pendingOrders,
      revenue,
      revenueThisMonth,
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
    ] = await Promise.all([
      db.user.count({ where: { deletedAt: null } }),
      db.user.count({ where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null } }),
      db.order.count(),
      db.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      db.order.count({ where: { status: "PENDING" } }),
      db.order.aggregate({
        where: { paymentStatus: "PAID" },
        _sum: { totalAmount: true },
      }),
      db.order.aggregate({
        where: { paymentStatus: "PAID", createdAt: { gte: thirtyDaysAgo } },
        _sum: { totalAmount: true },
      }),
      db.product.count({ where: { deletedAt: null, isActive: true } }),
      db.product.count({
        where: { deletedAt: null, isActive: true, stock: { gt: 0, lte: 5 } },
      }),
      db.product.count({ where: { deletedAt: null, isActive: true, stock: 0 } }),
    ]);

    const recentOrders = await db.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    const result: DashboardData = {
      users: { total: totalUsers, newThisMonth: newUsersThisMonth },
      orders: { total: totalOrders, thisMonth: ordersThisMonth, pending: pendingOrders },
      revenue: {
        total: Number(revenue._sum.totalAmount || 0),
        thisMonth: Number(revenueThisMonth._sum.totalAmount || 0),
      },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
      },
      recentOrders,
    };

    cache.set(DASHBOARD_CACHE_KEY, result, CACHE_TTL.ANALYTICS_DASHBOARD);

    return result;
  }

  static invalidateCache() {
    cache.invalidate(DASHBOARD_CACHE_KEY);
  }
}

interface DashboardData {
  users: { total: number; newThisMonth: number };
  orders: { total: number; thisMonth: number; pending: number };
  revenue: { total: number; thisMonth: number };
  products: { total: number; lowStock: number; outOfStock: number };
  recentOrders: unknown[];
}
