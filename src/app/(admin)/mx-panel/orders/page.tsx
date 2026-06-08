'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Search,
  Loader2,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useAdminClient } from '@/hooks/use-admin-client';
import type { AdminOrder } from '@/lib/client/admin';

const ORDER_STATUSES = [
  { value: '', label: 'الكل' },
  { value: 'PENDING', label: 'قيد الانتظار' },
  { value: 'CONFIRMED', label: 'مؤكد' },
  { value: 'PROCESSING', label: 'قيد التجهيز' },
  { value: 'SHIPPED', label: 'تم الشحن' },
  { value: 'DELIVERED', label: 'تم التوصيل' },
  { value: 'CANCELLED', label: 'ملغي' },
  { value: 'RETURNED', label: 'مرتجع' },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
  CONFIRMED: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  PROCESSING: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400',
  SHIPPED: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
  DELIVERED: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  CANCELLED: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  RETURNED: 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  CONFIRMED: 'مؤكد',
  PROCESSING: 'قيد التجهيز',
  SHIPPED: 'تم الشحن',
  DELIVERED: 'تم التوصيل',
  CANCELLED: 'ملغي',
  RETURNED: 'مرتجع',
};

export default function OrdersPage() {
  const client = useAdminClient();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    setError('');

    try {
      const result = await client.orders.list({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      if (result.success) {
        const data = result as unknown as { data: AdminOrder[]; pagination?: { totalPages: number } };
        setOrders(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else if (!result.success) {
        setError(result.error.message);
      }
    } catch {
      setError('فشل في تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  }, [client, page, search, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (!client || updatingId) return;
    setUpdatingId(orderId);
    try {
      const result = await client.orders.updateStatus(orderId, { status: newStatus });
      if (result.success && result.data) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      } else if (!result.success) {
        alert(result.error.message);
      }
    } catch {
      alert('فشل في تحديث الحالة');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart size={24} className="text-primary" />
        <h1 className="text-2xl font-bold text-foreground">الطلبات</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchOrders(); }} className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="بحث برقم الطلب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
          />
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </form>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="appearance-none pr-10 pl-4 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm cursor-pointer"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
          <p>لا توجد طلبات</p>
        </div>
      ) : (
        <>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">رقم الطلب</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">العميل</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">الإجمالي</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">الحالة</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">الدفع</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">التاريخ</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition">
                      <td className="px-4 py-3 font-mono text-foreground text-xs">
                        {order.orderNumber || order.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {order.user ? `${order.user.firstName} ${order.user.lastName}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-foreground font-medium">
                        {order.total.toLocaleString('ar-EG')} ر.س
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          disabled={updatingId === order.id}
                          className={`appearance-none px-2 py-1 rounded-full text-xs font-medium border-0 outline-none cursor-pointer ${STATUS_COLORS[order.status] || 'bg-muted text-foreground'} disabled:opacity-50`}
                        >
                          {ORDER_STATUSES.filter((s) => s.value).map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-yellow-600'}`}>
                          {order.paymentStatus === 'PAID' ? 'مدفوع' : 'غير مدفوع'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center">
                          <Link
                            href={`/mx-panel/orders/${order.id}`}
                            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
                            title="عرض التفاصيل"
                          >
                            <Eye size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted transition disabled:opacity-30"
              >
                <ChevronRight size={18} />
              </button>
              <span className="text-sm text-muted-foreground px-3">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted transition disabled:opacity-30"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
