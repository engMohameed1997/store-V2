'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Loader2,
  AlertCircle,
  Bell,
  CheckCircle2,
  ChevronLeft,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { getJson, postJson } from '@/lib/client/api';

const ADMIN_BASE = '/api/v1/mx-panel';

interface DashboardData {
  users: { total: number; newThisMonth: number; totalCustomers: number; activeUsers?: number };
  orders: { total: number; thisMonth: number; weekly: number; today: number; pending: number };
  revenue: { total: number; thisMonth: number; weekly: number; today: number };
  products: { total: number; lowStock: number; outOfStock: number };
  recentOrders: any[];
}

interface LowStockProduct {
  id: string;
  name: string;
  nameAr: string | null;
  stock: number;
  price: number | string;
}

function formatPrice(price: number | string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return num.toLocaleString('ar-IQ');
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ar-IQ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  CONFIRMED: 'مؤكد',
  PROCESSING: 'قيد التجهيز',
  SHIPPED: 'تم الشحن',
  DELIVERED: 'تم التسليم',
  CANCELLED: 'ملغي',
  REFUNDED: 'مسترجع',
};

export default function DashboardPage() {
  const { accessToken } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Notification form state
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifTarget, setNotifTarget] = useState<'ALL' | 'CUSTOMERS' | 'ADMINS'>('ALL');
  const [notifType, setNotifType] = useState<'PROMOTION' | 'SYSTEM'>('SYSTEM');
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState(false);

  const opts = { token: accessToken! };

  const fetchDashboardData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const result = await getJson<DashboardData>(`${ADMIN_BASE}/analytics`, opts);
      if (result.success && result.data) {
        setData(result.data as unknown as DashboardData);
      }

      // Also get the low stock products lists
      const productsResult = await getJson<any>(`${ADMIN_BASE}/products?limit=10`, opts);
      if (productsResult.success && productsResult.data) {
        // Filter those with stock <= 5
        const items = (productsResult.data as any[]).filter((p) => p.stock <= (p.lowStockThreshold || 5));
        setLowStockProducts(items);
      }
    } catch {
      setError('فشل في تحميل بيانات لوحة التحكم');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || sendingNotif) return;
    if (!notifTitle.trim() || !notifBody.trim()) return;

    setSendingNotif(true);
    setNotifSuccess(false);
    try {
      const result = await postJson(`${ADMIN_BASE}/notifications`, {
        title: notifTitle.trim(),
        body: notifBody.trim(),
        type: notifType,
        target: notifTarget,
      }, opts);

      if (result.success) {
        setNotifSuccess(true);
        setNotifTitle('');
        setNotifBody('');
        setTimeout(() => setNotifSuccess(false), 3000);
      }
    } catch {
      alert('فشل في إرسال الإشعار');
    } finally {
      setSendingNotif(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <TrendingUp className="text-primary" size={26} />
            لوحة التحكم الرئيسية
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            نظرة عامة على أداء مبيعاتك وإدارة متجرك لليوم.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 border border-border rounded-xl text-xs hover:bg-muted font-medium transition"
        >
          تحديث البيانات
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Grid Stats */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card 1: Today Sales */}
          <Link
            href="/mx-panel/orders"
            className="bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-primary/50 transition block cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted-foreground uppercase">مبيعات اليوم</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <DollarSign size={18} className="text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <p className="text-xl font-black text-foreground">
              {formatPrice(data.revenue.today)} <span className="text-xs font-normal text-muted-foreground">د.ع</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              الأسبوع: {formatPrice(data.revenue.weekly)} د.ع • الشهر: {formatPrice(data.revenue.thisMonth)} د.ع
            </p>
          </Link>

          {/* Card 2: Today Orders */}
          <Link
            href="/mx-panel/orders"
            className="bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-primary/50 transition block cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted-foreground uppercase">طلبات اليوم</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <ShoppingCart size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xl font-black text-foreground">
              {data.orders.today.toLocaleString('ar-IQ')}{' '}
              <span className="text-xs font-normal text-muted-foreground">طلبات</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              الأسبوع: {data.orders.weekly.toLocaleString('ar-IQ')} • الانتظار: {data.orders.pending.toLocaleString('ar-IQ')}
            </p>
          </Link>

          {/* Card 3: Customers */}
          <Link
            href="/mx-panel/users"
            className="bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-primary/50 transition block cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted-foreground uppercase">عدد العملاء</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <Users size={18} className="text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xl font-black text-foreground">
              {data.users.totalCustomers.toLocaleString('ar-IQ')}{' '}
              <span className="text-xs font-normal text-muted-foreground">عميل</span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
              النشطون (30 يوم): {data.users.activeUsers?.toLocaleString('ar-IQ') || 0}
              <br />
              الجدد هذا الشهر: +{data.users.newThisMonth.toLocaleString('ar-IQ')}
            </p>
          </Link>

          {/* Card 4: Inventory Alerts */}
          <Link
            href="/mx-panel/products"
            className="bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-primary/50 transition block cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted-foreground uppercase">حالة المخزون</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                data.products.lowStock > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-green-50 dark:bg-green-900/20'
              }`}>
                <Package size={18} className={data.products.lowStock > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'} />
              </div>
            </div>
            <p className="text-xl font-black text-foreground">
              {data.products.lowStock.toLocaleString('ar-IQ')}{' '}
              <span className="text-xs font-normal text-muted-foreground">منتجات منخفضة</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              المنتجات الكلية: {data.products.total.toLocaleString('ar-IQ')}
            </p>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Recent Orders */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Orders List */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <ShoppingCart size={18} className="text-primary" />
                أحدث الطلبات المستلمة
              </h2>
              <Link
                href="/mx-panel/orders"
                className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
              >
                كل الطلبات
                <ChevronLeft size={14} />
              </Link>
            </div>

            {(!data || data.recentOrders.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-6">لا توجد طلبات حديثة</p>
            ) : (
              <div className="space-y-3">
                {data.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between gap-4 p-3 border border-border rounded-xl hover:border-primary/30 transition bg-background/50"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{order.orderNumber}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {order.user ? `${order.user.firstName} ${order.user.lastName}` : 'عميل غير مسجل'} • {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-foreground">{formatPrice(order.totalAmount)} د.ع</p>
                      <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-bold mt-1 ${
                        order.status === 'PENDING'
                          ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                          : 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                      }`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-bold text-foreground flex items-center gap-2 mb-4">
              <AlertTriangle className="text-amber-500" size={18} />
              منتجات أوشكت على النفاد
            </h2>

            {lowStockProducts.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 py-3">
                <CheckCircle2 size={16} />
                <span>المخزون كافٍ لجميع المنتجات. لا توجد تنبيهات!</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lowStockProducts.map((p) => (
                  <div key={p.id} className="p-3 border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/10 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-foreground truncate max-w-[180px]">{p.nameAr || p.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">السعر: {formatPrice(p.price)} د.ع</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                      p.stock === 0
                        ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                        : 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                    }`}>
                      {p.stock === 0 ? 'نفذ تماماً' : `المتبقي: ${p.stock}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Quick Notifications */}
        <div>
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-bold text-foreground flex items-center gap-2 mb-4">
              <Bell size={18} className="text-primary" />
              إشعار سريع للعملاء
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              أرسل إعلان ترويجي أو إشعار فوري لجميع المستخدمين أو فئة محددة.
            </p>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">عنوان الإشعار *</label>
                <input
                  type="text"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="مثال: خصومات نهاية الأسبوع!"
                  className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">محتوى الإشعار *</label>
                <textarea
                  value={notifBody}
                  onChange={(e) => setNotifBody(e.target.value)}
                  placeholder="اكتب هنا محتوى الرسالة بالتفصيل..."
                  className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm resize-none"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">المستهدف</label>
                  <select
                    value={notifTarget}
                    onChange={(e) => setNotifTarget(e.target.value as any)}
                    className="w-full px-2 py-2 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-xs"
                  >
                    <option value="ALL">الكل</option>
                    <option value="CUSTOMERS">العملاء فقط</option>
                    <option value="ADMINS">المشرفين فقط</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">نوع الإشعار</label>
                  <select
                    value={notifType}
                    onChange={(e) => setNotifType(e.target.value as any)}
                    className="w-full px-2 py-2 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-xs"
                  >
                    <option value="SYSTEM">تنبيه نظام</option>
                    <option value="PROMOTION">إعلان وترويج</option>
                  </select>
                </div>
              </div>

              {notifSuccess && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 size={14} />
                  <span>تم إرسال الإشعارات للعملاء بنجاح!</span>
                </div>
              )}

              <button
                type="submit"
                disabled={sendingNotif}
                className="w-full py-2.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/95 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sendingNotif ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Bell size={15} />
                    <span>إرسال الآن</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
