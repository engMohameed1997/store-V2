import { db } from "@/lib/db";
import { cache, CACHE_TTL } from "@/lib/api/cache";

const DASHBOARD_CACHE_KEY = "analytics:dashboard";
const REPORTS_CACHE_KEY = "analytics:reports";

export class AnalyticsService {
  static async getDashboard(skipCache = false) {
    if (!skipCache) {
      const cached = cache.get<DashboardData>(DASHBOARD_CACHE_KEY);
      if (cached) return cached;
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalUsers,
      newUsersThisMonth,
      totalCustomers,
      totalOrders,
      ordersThisMonth,
      ordersToday,
      pendingOrders,
      revenue,
      revenueThisMonth,
      revenueToday,
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
    ] = await Promise.all([
      db.user.count({ where: { deletedAt: null } }),
      db.user.count({ where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null } }),
      db.user.count({ where: { role: "CUSTOMER", deletedAt: null } }),
      db.order.count(),
      db.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      db.order.count({ where: { createdAt: { gte: todayStart } } }),
      db.order.count({ where: { status: "PENDING" } }),
      db.order.aggregate({
        where: { paymentStatus: "PAID" },
        _sum: { totalAmount: true },
      }),
      db.order.aggregate({
        where: { paymentStatus: "PAID", createdAt: { gte: thirtyDaysAgo } },
        _sum: { totalAmount: true },
      }),
      db.order.aggregate({
        where: { paymentStatus: "PAID", createdAt: { gte: todayStart } },
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
      users: { total: totalUsers, newThisMonth: newUsersThisMonth, totalCustomers },
      orders: { total: totalOrders, thisMonth: ordersThisMonth, today: ordersToday, pending: pendingOrders },
      revenue: {
        total: Number(revenue._sum.totalAmount || 0),
        thisMonth: Number(revenueThisMonth._sum.totalAmount || 0),
        today: Number(revenueToday._sum.totalAmount || 0),
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

  static async getReports(skipCache = false) {
    if (!skipCache) {
      const cached = cache.get<ReportsData>(REPORTS_CACHE_KEY);
      if (cached) return cached;
    }

    const [topProducts, topCustomers, topCategories, mostViewedProducts] = await Promise.all([
      // Top selling products
      db.product.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true, nameAr: true, soldCount: true, price: true, stock: true },
        orderBy: { soldCount: "desc" },
        take: 10,
      }),
      // Top customers by order count
      db.user.findMany({
        where: { role: "CUSTOMER", deletedAt: null },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          _count: { select: { orders: true } },
        },
        orderBy: { orders: { _count: "desc" } },
        take: 10,
      }),
      // Top categories by product count
      db.category.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          nameAr: true,
          _count: { select: { products: true } },
        },
        orderBy: { products: { _count: "desc" } },
        take: 10,
      }),
      // Most viewed products
      db.product.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true, nameAr: true, viewCount: true, soldCount: true },
        orderBy: { viewCount: "desc" },
        take: 10,
      }),
    ]);

    const result: ReportsData = {
      topProducts,
      topCustomers: topCustomers.map((c) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        phone: c.phone,
        orderCount: c._count.orders,
      })),
      topCategories: topCategories.map((c) => ({
        id: c.id,
        name: c.nameAr || c.name,
        productCount: c._count.products,
      })),
      mostViewedProducts,
    };

    cache.set(REPORTS_CACHE_KEY, result, CACHE_TTL.ANALYTICS_DASHBOARD);
    return result;
  }

  static invalidateCache() {
    cache.invalidate(DASHBOARD_CACHE_KEY);
    cache.invalidate(REPORTS_CACHE_KEY);
  }
}

interface DashboardData {
  users: { total: number; newThisMonth: number; totalCustomers: number };
  orders: { total: number; thisMonth: number; today: number; pending: number };
  revenue: { total: number; thisMonth: number; today: number };
  products: { total: number; lowStock: number; outOfStock: number };
  recentOrders: unknown[];
}

interface ReportsData {
  topProducts: { id: string; name: string; nameAr: string | null; soldCount: number; price: unknown; stock: number }[];
  topCustomers: { id: string; name: string; phone: string | null; orderCount: number }[];
  topCategories: { id: string; name: string; productCount: number }[];
  mostViewedProducts: { id: string; name: string; nameAr: string | null; viewCount: number; soldCount: number }[];
}
