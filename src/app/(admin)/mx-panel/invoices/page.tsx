'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  FileText,
  Loader2,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Printer,
} from 'lucide-react';
import { useAdminClient } from '@/hooks/use-admin-client';
import type { AdminOrder } from '@/lib/client/admin';

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

export default function InvoicesPage() {
  const client = useAdminClient();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    setError('');
    try {
      const result = await client.orders.list({ page, limit: 20, search: search || undefined });
      if (result.success) {
        const data = result as unknown as {
          data: AdminOrder[];
          pagination?: { totalPages: number };
        };
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
  }, [client, page, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <FileText size={24} className="text-primary" />
        <h1 className="text-2xl font-bold text-foreground">الفواتير</h1>
      </div>

      {/* Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
        }}
        className="mb-6"
      >
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="بحث برقم الطلب أو اسم العميل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
          />
          <Search
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <FileText size={48} className="mx-auto mb-3 opacity-30" />
          <p>لا توجد فواتير</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 hover:border-primary/30 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm text-foreground">
                      {order.orderNumber}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {order.user && (
                      <span>
                        {order.user.firstName} {order.user.lastName}
                      </span>
                    )}
                    <span>•</span>
                    <span>{formatDate(order.createdAt)}</span>
                    <span>•</span>
                    <span className="font-semibold text-foreground">
                      {formatPrice(order.totalAmount)} د.ع
                    </span>
                  </div>
                </div>
                <Link
                  href={`/mx-panel/invoices/${order.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-xs font-medium text-primary hover:bg-primary/5 transition shrink-0"
                >
                  <Printer size={14} />
                  عرض الفاتورة
                </Link>
              </div>
            ))}
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
