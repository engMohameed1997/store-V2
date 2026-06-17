'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  BarChart3,
  Loader2,
  AlertCircle,
  TrendingUp,
  Users,
  Package,
  Eye,
  FolderTree,
  Heart,
  ShoppingCart,
  Crown,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { getJson } from '@/lib/client/api';

const ADMIN_BASE = '/api/v1/mx-panel';

interface TopProduct {
  id: string;
  name: string;
  nameAr: string | null;
  soldCount: number;
  price: number | string;
  stock: number;
}

interface TopCustomer {
  id: string;
  name: string;
  phone: string | null;
  orderCount: number;
}

interface TopCategory {
  id: string;
  name: string;
  productCount: number;
}

interface MostViewedProduct {
  id: string;
  name: string;
  nameAr: string | null;
  viewCount: number;
  soldCount: number;
}

interface TopWishlistedProduct {
  id: string;
  name: string;
  nameAr: string | null;
  price: number;
  wishlistCount: number;
}

interface PopularSearch {
  query: string;
  count: number;
}

interface OrderCompletionRate {
  total: number;
  completed: number;
  cancelled: number;
  rate: number;
}

interface VipCustomer {
  id: string;
  name: string;
  phone: string | null;
  orderCount: number;
  totalRevenue: number;
}

interface WishlistVsCart {
  totalWishlist: number;
  totalCart: number;
  products: { id: string; name: string; wishlistCount: number; cartCount: number }[];
}

interface ReportsData {
  topProducts: TopProduct[];
  topCustomers: TopCustomer[];
  topCategories: TopCategory[];
  mostViewedProducts: MostViewedProduct[];
  topWishlisted: TopWishlistedProduct[];
  popularSearches: PopularSearch[];
  orderCompletionRate?: OrderCompletionRate;
  vipCustomers?: VipCustomer[];
  wishlistVsCart?: WishlistVsCart;
}

function formatPrice(price: number | string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return num.toLocaleString('ar-IQ');
}

export default function ReportsPage() {
  const { accessToken } = useAuth();
  const [data, setData] = useState<ReportsData | null>(null);
  const [pageViews, setPageViews] = useState<{ path: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const opts = { token: accessToken! };

  const fetchReports = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [result, pageViewsResult] = await Promise.all([
        getJson<ReportsData>(`${ADMIN_BASE}/analytics/reports`, opts),
        getJson<{ path: string; count: number }[]>(`${ADMIN_BASE}/analytics/page-views`, opts),
      ]);

      if (result.success && result.data) {
        setData(result.data as unknown as ReportsData);
      }
      if (pageViewsResult.success && pageViewsResult.data) {
        setPageViews(pageViewsResult.data as unknown as { path: string; count: number }[]);
      }
    } catch {
      setError('فشل في تحميل التقارير');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <AlertCircle size={48} className="mx-auto mb-3 text-red-500 opacity-60" />
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 size={24} className="text-primary" />
        <h1 className="text-2xl font-bold text-foreground">التقارير والتحليلات</h1>
      </div>

      {/* Order Completion Rate + Summary Cards */}
      {data?.orderCompletionRate && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{data.orderCompletionRate.total.toLocaleString('ar-IQ')}</p>
            <p className="text-xs text-muted-foreground mt-1">اجمالي الطلبات</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{data.orderCompletionRate.completed.toLocaleString('ar-IQ')}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">مكتملة</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <XCircle size={16} className="text-red-500" />
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{data.orderCompletionRate.cancelled.toLocaleString('ar-IQ')}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">ملغاة</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">{data.orderCompletionRate.rate}%</p>
            <p className="text-xs text-muted-foreground mt-1">معدل الاتمام</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-emerald-500" />
            <h2 className="font-bold text-foreground">المنتجات الأكثر مبيعاً</h2>
          </div>
          {data?.topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</p>
          ) : (
            <div className="space-y-2">
              {data?.topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-border last:border-b-0">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.nameAr || p.name}</p>
                    <p className="text-[11px] text-muted-foreground">{formatPrice(p.price)} د.ع • مخزون: {p.stock}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                    {p.soldCount} مبيعة
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Most Viewed Products */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Eye size={18} className="text-blue-500" />
            <h2 className="font-bold text-foreground">المنتجات الأكثر مشاهدة</h2>
          </div>
          {data?.mostViewedProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</p>
          ) : (
            <div className="space-y-2">
              {data?.mostViewedProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-border last:border-b-0">
                  <span className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.nameAr || p.name}</p>
                    <p className="text-[11px] text-muted-foreground">{p.soldCount} مبيعة</p>
                  </div>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400 shrink-0">
                    {p.viewCount.toLocaleString('ar-IQ')} مشاهدة
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Top Customers */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-purple-500" />
            <h2 className="font-bold text-foreground">العملاء الأكثر شراءً</h2>
          </div>
          {data?.topCustomers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</p>
          ) : (
            <div className="space-y-2">
              {data?.topCustomers.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 py-2 border-b border-border last:border-b-0">
                  <span className="w-6 h-6 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    {c.phone && <p className="text-[11px] text-muted-foreground" dir="ltr">{c.phone}</p>}
                  </div>
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400 shrink-0">
                    {c.orderCount} طلب
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Top Categories */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <FolderTree size={18} className="text-amber-500" />
            <h2 className="font-bold text-foreground">الأقسام الأكثر منتجات</h2>
          </div>
          {data?.topCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</p>
          ) : (
            <div className="space-y-2">
              {data?.topCategories.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 py-2 border-b border-border last:border-b-0">
                  <span className="w-6 h-6 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                  </div>
                  <div className="shrink-0">
                    <div className="flex items-center gap-2">
                      <Package size={14} className="text-muted-foreground" />
                      <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                        {c.productCount} منتج
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Top Wishlisted Products */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-rose-500" />
            <h2 className="font-bold text-foreground">المنتجات الأكثر إضافة للمفضلة</h2>
          </div>
          {!data?.topWishlisted || data.topWishlisted.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</p>
          ) : (
            <div className="space-y-2">
              {data.topWishlisted.map((w, i) => (
                <div key={w.id} className="flex items-center gap-3 py-2 border-b border-border last:border-b-0">
                  <span className="w-6 h-6 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{w.nameAr || w.name}</p>
                    <p className="text-[11px] text-muted-foreground">{formatPrice(w.price)} د.ع</p>
                  </div>
                  <span className="text-sm font-bold text-rose-600 dark:text-rose-400 shrink-0">
                    {w.wishlistCount} زبون مفضل
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* VIP Customers */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Crown size={18} className="text-amber-500" />
            <h2 className="font-bold text-foreground">الزبائن المميزون (VIP)</h2>
          </div>
          {!data?.vipCustomers || data.vipCustomers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</p>
          ) : (
            <div className="space-y-2">
              {data.vipCustomers.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 py-2 border-b border-border last:border-b-0">
                  <span className="w-6 h-6 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    {c.phone && <p className="text-[11px] text-muted-foreground" dir="ltr">{c.phone}</p>}
                  </div>
                  <div className="text-left shrink-0">
                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{formatPrice(c.totalRevenue)} د.ع</p>
                    <p className="text-[10px] text-muted-foreground">{c.orderCount} طلب</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Wishlist vs Cart */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Heart size={18} className="text-pink-500" />
            <h2 className="font-bold text-foreground">المفضلة مقابل السلة</h2>
          </div>
          {data?.wishlistVsCart && (
            <div className="flex gap-4 mb-4">
              <div className="flex-1 bg-pink-50 dark:bg-pink-900/10 rounded-xl p-3 text-center">
                <Heart size={16} className="mx-auto text-pink-500 mb-1" />
                <p className="text-lg font-bold text-pink-600 dark:text-pink-400">{data.wishlistVsCart.totalWishlist.toLocaleString('ar-IQ')}</p>
                <p className="text-[10px] text-muted-foreground">عنصر بالمفضلة</p>
              </div>
              <div className="flex-1 bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3 text-center">
                <ShoppingCart size={16} className="mx-auto text-blue-500 mb-1" />
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{data.wishlistVsCart.totalCart.toLocaleString('ar-IQ')}</p>
                <p className="text-[10px] text-muted-foreground">عنصر بالسلة</p>
              </div>
            </div>
          )}
          {!data?.wishlistVsCart?.products || data.wishlistVsCart.products.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</p>
          ) : (
            <div className="space-y-2">
              {data.wishlistVsCart.products.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-border last:border-b-0">
                  <span className="w-6 h-6 rounded-full bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs shrink-0">
                    <span className="text-pink-600 dark:text-pink-400 font-bold">{p.wishlistCount} مفضلة</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">{p.cartCount} سلة</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Popular Searches */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Eye size={18} className="text-teal-500" />
            <h2 className="font-bold text-foreground">أكثر الكلمات بحثاً</h2>
          </div>
          {!data?.popularSearches || data.popularSearches.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</p>
          ) : (
            <div className="space-y-2">
              {data.popularSearches.map((s, i) => (
                <div key={s.query} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-foreground">{s.query}</span>
                  </div>
                  <span className="text-sm font-bold text-teal-600 dark:text-teal-400 shrink-0">
                    {s.count.toLocaleString('ar-IQ')} بحث
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Top Visited Pages */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-indigo-500" />
            <h2 className="font-bold text-foreground">أكثر الصفحات زيارة (Page Views)</h2>
          </div>
          {pageViews.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات زيارات بعد</p>
          ) : (
            <div className="space-y-2">
              {pageViews.map((p, i) => (
                <div key={p.path} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-foreground" dir="ltr">{p.path}</span>
                  </div>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                    {p.count.toLocaleString('ar-IQ')} زيارة
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
