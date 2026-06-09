'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Package,
  ShoppingCart,
  Users,
  Star,
  TrendingUp,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAdminClient } from '@/hooks/use-admin-client';

interface DashboardStats {
  products: number;
  orders: number;
  users: number;
  reviews: number;
}

export default function DashboardPage() {
  const client = useAdminClient();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    setError('');

    try {
      const [products, orders, users, reviews] = await Promise.allSettled([
        client.products.list({ limit: 1 }),
        client.orders.list({ limit: 1 }),
        client.users.list({ limit: 1 }),
        client.reviews.list({ limit: 1 }),
      ]);

      const extractTotal = (result: PromiseSettledResult<unknown>): number => {
        if (result.status === 'fulfilled') {
          const r = result.value as { success: boolean; pagination?: { total: number }; data?: unknown[] };
          if (r.success && r.pagination?.total !== undefined) return r.pagination.total;
          if (r.success && Array.isArray(r.data)) return r.data.length;
        }
        return 0;
      };

      setStats({
        products: extractTotal(products),
        orders: extractTotal(orders),
        users: extractTotal(users),
        reviews: extractTotal(reviews),
      });
    } catch {
      setError('فشل في تحميل الإحصائيات');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const STAT_CARDS = [
    { label: 'المنتجات', value: stats?.products ?? 0, icon: Package, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'الطلبات', value: stats?.orders ?? 0, icon: ShoppingCart, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'المستخدمين', value: stats?.users ?? 0, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'المراجعات', value: stats?.reviews ?? 0, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <TrendingUp size={24} className="text-primary" />
          <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
        </div>
        <p className="text-muted-foreground text-sm">نظرة عامة على إحصائيات متجر الخزاعي الإلكتروني</p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={18} />
          {error}
          <button onClick={fetchStats} className="mr-auto text-xs underline hover:no-underline">
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Stats Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="bg-card border border-border rounded-2xl p-6 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <Icon size={24} className={card.color} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{card.value.toLocaleString('ar-EG')}</p>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
