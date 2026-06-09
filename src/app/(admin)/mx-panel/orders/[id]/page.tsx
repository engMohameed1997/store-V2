'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingCart,
  ArrowRight,
  Loader2,
  AlertCircle,
  User,
  MapPin,
  CreditCard,
  Package,
  CheckCircle2,
} from 'lucide-react';
import { useAdminClient } from '@/hooks/use-admin-client';
import type { AdminOrder } from '@/lib/client/admin';

const ORDER_STATUSES = [
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

function formatPrice(price: number | string | undefined | null): string {
  if (price === undefined || price === null) return '0';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return isNaN(num) ? '0' : num.toLocaleString('ar-IQ');
}

interface OrderDetail extends AdminOrder {
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    phone?: string;
  };
  note?: string;
  transactionId?: string;
}

export default function OrderDetailPage() {
  const client = useAdminClient();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [transactionInput, setTransactionInput] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!client || !orderId) return;
    setLoading(true);
    setError('');

    try {
      const result = await client.orders.get(orderId);
      if (result.success && result.data) {
        setOrder(result.data as unknown as OrderDetail);
      } else if (!result.success) {
        setError(result.error.message);
      }
    } catch {
      setError('فشل في تحميل بيانات الطلب');
    } finally {
      setLoading(false);
    }
  }, [client, orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStatusChange = async (newStatus: string) => {
    if (!client || updatingStatus || !order) return;

    // Prevent illogical transitions
    if (order.status === 'DELIVERED' && newStatus !== 'RETURNED') {
      alert('لا يمكن تغيير حالة طلب تم توصيله إلا إلى مرتجع');
      return;
    }
    if (order.status === 'CANCELLED') {
      alert('لا يمكن تغيير حالة طلب ملغي');
      return;
    }

    if (!confirm(`هل تريد تغيير حالة الطلب إلى "${STATUS_LABELS[newStatus] || newStatus}"؟`)) return;

    setUpdatingStatus(true);
    try {
      const result = await client.orders.updateStatus(orderId, { status: newStatus });
      if (result.success && result.data) {
        setOrder((prev) => prev ? { ...prev, status: newStatus } : prev);
      } else if (!result.success) {
        alert(result.error.message);
      }
    } catch {
      alert('فشل في تحديث حالة الطلب');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!client || confirmingPayment || !order) return;

    if (!confirm('هل تريد تأكيد الدفع لهذا الطلب؟')) return;

    setConfirmingPayment(true);
    try {
      const result = await client.orders.confirmPayment(orderId, transactionInput.trim() || undefined);
      if (result.success && result.data) {
        setOrder((prev) => prev ? { ...prev, paymentStatus: 'PAID', transactionId: transactionInput.trim() || prev.transactionId } : prev);
        setShowPaymentForm(false);
        setTransactionInput('');
      } else if (!result.success) {
        alert(result.error.message);
      }
    } catch {
      alert('فشل في تأكيد الدفع');
    } finally {
      setConfirmingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/mx-panel/orders"
            className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted transition"
          >
            <ArrowRight size={18} />
          </Link>
          <ShoppingCart size={24} className="text-primary" />
          <h1 className="text-2xl font-bold text-foreground">تفاصيل الطلب</h1>
        </div>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/mx-panel/orders"
            className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted transition"
          >
            <ArrowRight size={18} />
          </Link>
          <ShoppingCart size={24} className="text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              طلب #{order.orderNumber || order.id.slice(0, 8)}
            </h1>
            <p className="text-xs text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[order.status] || 'bg-muted text-foreground'}`}>
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Status Management */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-primary" />
            إدارة الحالة
          </h2>
          <div className="flex flex-wrap gap-2">
            {ORDER_STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => handleStatusChange(s.value)}
                disabled={updatingStatus || order.status === s.value || order.status === 'CANCELLED'}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition disabled:opacity-40 disabled:cursor-not-allowed ${
                  order.status === s.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {updatingStatus ? <Loader2 size={12} className="animate-spin inline" /> : null}
                {s.label}
              </button>
            ))}
          </div>
        </section>

        {/* Payment Info */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <CreditCard size={18} className="text-primary" />
            معلومات الدفع
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <span className="text-xs text-muted-foreground">حالة الدفع</span>
              <p className={`font-bold text-sm mt-0.5 ${order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-yellow-600'}`}>
                {order.paymentStatus === 'PAID' ? 'مدفوع' : 'غير مدفوع'}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">طريقة الدفع</span>
              <p className="font-medium text-foreground text-sm mt-0.5">{order.paymentMethod || '—'}</p>
            </div>
            {order.transactionId && (
              <div>
                <span className="text-xs text-muted-foreground">رقم العملية</span>
                <p className="font-mono text-foreground text-xs mt-0.5">{order.transactionId}</p>
              </div>
            )}
          </div>

          {order.paymentStatus !== 'PAID' && (
            <div className="mt-4 pt-4 border-t border-border">
              {showPaymentForm ? (
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">رقم العملية (اختياري)</label>
                    <input
                      type="text"
                      value={transactionInput}
                      onChange={(e) => setTransactionInput(e.target.value)}
                      placeholder="Transaction ID..."
                      className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
                      dir="ltr"
                    />
                  </div>
                  <button
                    onClick={handleConfirmPayment}
                    disabled={confirmingPayment}
                    className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {confirmingPayment ? <Loader2 size={14} className="animate-spin" /> : 'تأكيد الدفع'}
                  </button>
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    className="px-4 py-2 border border-border rounded-xl text-sm hover:bg-muted transition"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition"
                >
                  تأكيد الدفع
                </button>
              )}
            </div>
          )}
        </section>

        {/* Order Summary */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Package size={18} className="text-primary" />
            ملخص الطلب
          </h2>

          {/* Items */}
          {order.items && order.items.length > 0 ? (
            <div className="border border-border rounded-xl overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">المنتج</th>
                    <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">الكمية</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">السعر</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium text-foreground">{item.productName}</td>
                      <td className="px-4 py-3 text-center text-foreground">{item.quantity}</td>
                      <td className="px-4 py-3 text-foreground">{formatPrice(item.price)} د.ع</td>
                      <td className="px-4 py-3 font-medium text-foreground">{formatPrice(item.totalPrice)} د.ع</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-4">لا توجد عناصر</p>
          )}

          {/* Totals */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">المجموع الفرعي</span>
              <span className="text-foreground">{formatPrice(order.subtotal)} د.ع</span>
            </div>
            {parseFloat(String(order.shippingCost)) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">الشحن</span>
                <span className="text-foreground">{formatPrice(order.shippingCost)} د.ع</span>
              </div>
            )}
            {parseFloat(String(order.discountAmount)) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">الخصم</span>
                <span className="text-green-600">-{formatPrice(order.discountAmount)} د.ع</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-border font-bold">
              <span className="text-foreground">الإجمالي</span>
              <span className="text-foreground text-lg">{formatPrice(order.totalAmount)} د.ع</span>
            </div>
          </div>
        </section>

        {/* Customer Info */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <User size={18} className="text-primary" />
            معلومات العميل
          </h2>
          {order.user ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">الاسم</span>
                <p className="font-medium text-foreground mt-0.5">{order.user.firstName} {order.user.lastName}</p>
              </div>
              {order.user.email && (
                <div>
                  <span className="text-xs text-muted-foreground">البريد</span>
                  <p className="font-medium text-foreground mt-0.5" dir="ltr">{order.user.email}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">لا توجد معلومات عميل</p>
          )}
        </section>

        {/* Shipping Address */}
        {order.address && (
          <section className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-primary" />
              عنوان الشحن
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {order.address.street && (
                <div>
                  <span className="text-xs text-muted-foreground">الشارع</span>
                  <p className="font-medium text-foreground mt-0.5">{order.address.street}</p>
                </div>
              )}
              {order.address.city && (
                <div>
                  <span className="text-xs text-muted-foreground">المدينة</span>
                  <p className="font-medium text-foreground mt-0.5">{order.address.city}</p>
                </div>
              )}
              {order.address.state && (
                <div>
                  <span className="text-xs text-muted-foreground">المنطقة</span>
                  <p className="font-medium text-foreground mt-0.5">{order.address.state}</p>
                </div>
              )}
              {order.address.country && (
                <div>
                  <span className="text-xs text-muted-foreground">الدولة</span>
                  <p className="font-medium text-foreground mt-0.5">{order.address.country}</p>
                </div>
              )}
              {order.address.postalCode && (
                <div>
                  <span className="text-xs text-muted-foreground">الرمز البريدي</span>
                  <p className="font-medium text-foreground mt-0.5" dir="ltr">{order.address.postalCode}</p>
                </div>
              )}
              {order.address.phone && (
                <div>
                  <span className="text-xs text-muted-foreground">الهاتف</span>
                  <p className="font-medium text-foreground mt-0.5" dir="ltr">{order.address.phone}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Note */}
        {order.note && (
          <section className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-bold text-foreground mb-2">ملاحظة الطلب</h2>
            <p className="text-sm text-muted-foreground">{order.note}</p>
          </section>
        )}
      </div>
    </div>
  );
}
