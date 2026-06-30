'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Package, Eye, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { getJson } from '@/lib/client/api';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number | string;
  totalPrice: number | string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number | string;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'قيد الانتظار', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' },
  CONFIRMED: { label: 'مؤكد', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
  PROCESSING: { label: 'جاري التجهيز', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400' },
  SHIPPED: { label: 'تم الشحن', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' },
  DELIVERED: { label: 'تم التوصيل', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' },
  CANCELLED: { label: 'ملغي', color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
  REFUNDED: { label: 'مسترجع', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400' },
};

function formatPrice(price: number | string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return num.toLocaleString('ar-IQ');
}

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    const res = await getJson<any>(`/api/v1/orders?page=${page}&limit=10`);
    if (res.success) {
      setOrders(res.data || []);
      if ('pagination' in res) {
        setTotalPages((res as any).pagination?.totalPages || 1);
      }
    }
    setLoading(false);
  }, [isAuthenticated, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-32" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-muted rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground mb-6">طلباتي</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Package size={40} className="mx-auto text-muted-foreground/30 mb-3" />
          <h3 className="font-semibold text-foreground mb-1">لا توجد طلبات</h3>
          <p className="text-sm text-muted-foreground mb-4">لم تقم بأي طلب بعد</p>
          <Link href="/products" className="text-primary text-sm hover:underline">تصفح المنتجات</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const statusInfo = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' };
            return (
              <div key={order.id} className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">طلب #{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('ar-IQ', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                {/* Items summary */}
                <div className="text-sm text-muted-foreground mb-3">
                  {order.items?.slice(0, 2).map(item => (
                    <p key={item.id} className="truncate">{item.productName} × {item.quantity}</p>
                  ))}
                  {order.items && order.items.length > 2 && (
                    <p className="text-xs">و {order.items.length - 2} منتجات أخرى</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="font-bold text-primary text-sm">
                    {formatPrice(order.totalAmount)} د.ع
                  </span>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                  >
                    تفاصيل الطلب
                    <ChevronLeft size={12} />
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 rounded-lg border border-border bg-card text-sm disabled:opacity-50 hover:bg-muted transition"
              >
                السابق
              </button>
              <span className="text-sm text-muted-foreground">{page} من {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 rounded-lg border border-border bg-card text-sm disabled:opacity-50 hover:bg-muted transition"
              >
                التالي
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
