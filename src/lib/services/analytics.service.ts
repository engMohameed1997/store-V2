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
    
    // To handle timezone of Iraq (UTC+3) correctly, set hours to -3 UTC for start of today
    const todayStart = new Date(now);
    todayStart.setUTCHours(-3, 0, 0, 0);

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersThisMonth,
      totalCustomers,
      totalOrders,
      ordersThisMonth,
      ordersWeekly,
      ordersToday,
      pendingOrders,
      revenue,
      revenueThisMonth,
      revenueWeekly,
      revenueToday,
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      activeUsers,
    ] = await Promise.all([
      db.user.count({ where: { deletedAt: null } }),
      db.user.count({ where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null } }),
      db.user.count({ where: { role: "CUSTOMER", deletedAt: null } }),
      db.order.count(),
      db.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      db.order.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      db.order.count({ where: { createdAt: { gte: todayStart } } }),
      db.order.count({ where: { status: "PENDING" } }),
      db.order.aggregate({
        where: { status: { notIn: ["CANCELLED", "REFUNDED"] } },
        _sum: { totalAmount: true },
      }),
      db.order.aggregate({
        where: { status: { notIn: ["CANCELLED", "REFUNDED"] }, createdAt: { gte: thirtyDaysAgo } },
        _sum: { totalAmount: true },
      }),
      db.order.aggregate({
        where: { status: { notIn: ["CANCELLED", "REFUNDED"] }, createdAt: { gte: sevenDaysAgo } },
        _sum: { totalAmount: true },
      }),
      db.order.aggregate({
        where: { status: { notIn: ["CANCELLED", "REFUNDED"] }, createdAt: { gte: todayStart } },
        _sum: { totalAmount: true },
      }),
      db.product.count({ where: { deletedAt: null, isActive: true } }),
      db.product.count({
        where: { deletedAt: null, isActive: true, stock: { gt: 0, lte: 5 } },
      }),
      db.product.count({ where: { deletedAt: null, isActive: true, stock: 0 } }),
      db.pageView.groupBy({
        by: ["userId"],
        where: {
          createdAt: { gte: thirtyDaysAgo },
          userId: { not: null },
        },
      }).then((res) => res.length),
    ]);

    const recentOrders = await db.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    const result: DashboardData = {
      users: { total: totalUsers, newThisMonth: newUsersThisMonth, totalCustomers, activeUsers },
      orders: { total: totalOrders, thisMonth: ordersThisMonth, weekly: ordersWeekly, today: ordersToday, pending: pendingOrders },
      revenue: {
        total: Number(revenue?._sum?.totalAmount || 0),
        thisMonth: Number(revenueThisMonth?._sum?.totalAmount || 0),
        weekly: Number(revenueWeekly?._sum?.totalAmount || 0),
        today: Number(revenueToday?._sum?.totalAmount || 0),
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

    const [
      topProducts,
      topCustomers,
      topCategories,
      mostViewedProducts,
      topWishlisted,
      popularSearches,
      totalOrdersAll,
      completedOrders,
      cancelledOrders,
      wishlistCount,
      cartItemCount,
    ] = await Promise.all([
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
      // Most wishlisted products
      db.product.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          nameAr: true,
          price: true,
          _count: { select: { wishlistItems: true } },
        },
        orderBy: { wishlistItems: { _count: "desc" } },
        take: 10,
      }),
      // Popular search terms
      db.searchHistory.groupBy({
        by: ["query"],
        _count: {
          query: true,
        },
        orderBy: {
          _count: {
            query: "desc",
          },
        },
        take: 10,
      }),
      // Order completion rate
      db.order.count(),
      db.order.count({ where: { status: "DELIVERED" } }),
      db.order.count({ where: { status: "CANCELLED" } }),
      // Wishlist vs Cart counts
      db.wishlistItem.count(),
      db.cartItem.count(),
    ]);

    // VIP customers: top 10 by total revenue
    const vipCustomers = await db.order.groupBy({
      by: ["userId"],
      where: { status: { notIn: ["CANCELLED", "REFUNDED"] } },
      _sum: { totalAmount: true },
      _count: { id: true },
      orderBy: { _sum: { totalAmount: "desc" } },
      take: 10,
    });

    const vipUserIds = vipCustomers.map((v) => v.userId);
    const vipUsers = vipUserIds.length
      ? await db.user.findMany({
          where: { id: { in: vipUserIds } },
          select: { id: true, firstName: true, lastName: true, phone: true },
        })
      : [];
    const vipMap = new Map(vipUsers.map((u) => [u.id, u]));

    // Wishlist-to-cart conversion: products in wishlist that are also in carts
    const wishlistProducts = await db.wishlistItem.groupBy({
      by: ["productId"],
      _count: { productId: true },
      orderBy: { _count: { productId: "desc" } },
      take: 20,
    });
    const wishlistProductIds = wishlistProducts.map((w) => w.productId);
    const inCartCounts = wishlistProductIds.length
      ? await db.cartItem.groupBy({
          by: ["productId"],
          where: { productId: { in: wishlistProductIds } },
          _count: { productId: true },
        })
      : [];
    const cartMap = new Map(inCartCounts.map((c) => [c.productId, c._count.productId]));
    const wishlistProductDetails = wishlistProductIds.length
      ? await db.product.findMany({
          where: { id: { in: wishlistProductIds } },
          select: { id: true, name: true, nameAr: true },
        })
      : [];
    const prodMap = new Map(wishlistProductDetails.map((p) => [p.id, p]));

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
      topWishlisted: topWishlisted.map((w) => ({
        id: w.id,
        name: w.name,
        nameAr: w.nameAr,
        price: Number(w.price),
        wishlistCount: w._count.wishlistItems,
      })),
      popularSearches: popularSearches.map((s) => ({
        query: s.query,
        count: s._count.query,
      })),
      orderCompletionRate: {
        total: totalOrdersAll,
        completed: completedOrders,
        cancelled: cancelledOrders,
        rate: totalOrdersAll > 0 ? Math.round((completedOrders / totalOrdersAll) * 100) : 0,
      },
      vipCustomers: vipCustomers.map((v) => {
        const u = vipMap.get(v.userId);
        return {
          id: v.userId,
          name: u ? `${u.firstName} ${u.lastName}` : "زبون",
          phone: u?.phone || null,
          orderCount: v._count.id,
          totalRevenue: Number(v._sum.totalAmount || 0),
        };
      }),
      wishlistVsCart: {
        totalWishlist: wishlistCount,
        totalCart: cartItemCount,
        products: wishlistProducts.slice(0, 10).map((w) => {
          const p = prodMap.get(w.productId);
          return {
            id: w.productId,
            name: p?.nameAr || p?.name || "",
            wishlistCount: w._count.productId,
            cartCount: cartMap.get(w.productId) || 0,
          };
        }),
      },
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
  users: { total: number; newThisMonth: number; totalCustomers: number; activeUsers: number };
  orders: { total: number; thisMonth: number; weekly: number; today: number; pending: number };
  revenue: { total: number; thisMonth: number; weekly: number; today: number };
  products: { total: number; lowStock: number; outOfStock: number };
  recentOrders: unknown[];
}

interface ReportsData {
  topProducts: { id: string; name: string; nameAr: string | null; soldCount: number; price: unknown; stock: number }[];
  topCustomers: { id: string; name: string; phone: string | null; orderCount: number }[];
  topCategories: { id: string; name: string; productCount: number }[];
  mostViewedProducts: { id: string; name: string; nameAr: string | null; viewCount: number; soldCount: number }[];
  topWishlisted: { id: string; name: string; nameAr: string | null; price: number; wishlistCount: number }[];
  popularSearches: { query: string; count: number }[];
  orderCompletionRate: { total: number; completed: number; cancelled: number; rate: number };
  vipCustomers: { id: string; name: string; phone: string | null; orderCount: number; totalRevenue: number }[];
  wishlistVsCart: {
    totalWishlist: number;
    totalCart: number;
    products: { id: string; name: string; wishlistCount: number; cartCount: number }[];
  };
}
