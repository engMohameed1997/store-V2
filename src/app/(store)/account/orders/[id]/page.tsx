'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Package, ChevronLeft, MapPin, CreditCard, Truck } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { getJson } from '@/lib/client/api';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  variantName: string | null;
  quantity: number;
  price: number | string;
  totalPrice: number | string;
}

interface OrderAddress {
  fullName: string;
  phone: string;
  governorate: string;
  city: string;
  district: string | null;
  street: string | null;
}

interface OrderTimeline {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotalAmount: number | string;
  shippingAmount: number | string;
  discountAmount: number | string;
  totalAmount: number | string;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
  shippingAddress: OrderAddress | null;
  timeline: OrderTimeline[];
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

const PAYMENT_LABELS: Record<string, string> = {
  CASH_ON_DELIVERY: 'الدفع عند الاستلام',
  ZAIN_CASH: 'زين كاش',
  QI_CARD: 'كي كارد',
  FAST_PAY: 'فاست باي',
  CREDIT_CARD: 'بطاقة ائتمان',
};

function formatPrice(price: number | string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return num.toLocaleString('ar-IQ');
}

export default function OrderDetailPage() {
  const params = useParams();
  const { accessToken } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!accessToken || !params.id) return;
    getJson<OrderDetail>(`/api/v1/orders/${params.id}`, { token: accessToken })
      .then(res => {
        if (res.success) setOrder(res.data as OrderDetail);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [accessToken, params.id]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-40 bg-muted rounded-xl" />
        <div className="h-32 bg-muted rounded-xl" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12 bg-card rounded-xl border border-border">
        <Package size={40} className="mx-auto text-muted-foreground/30 mb-3" />
        <h3 className="font-semibold text-foreground mb-1">لم يتم العثور على الطلب</h3>
        <Link href="/account/orders" className="text-primary text-sm hover:underline mt-2 inline-block">
          العودة لقائمة الطلبات
        </Link>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link href="/account/orders" className="hover:text-primary transition flex items-center gap-1">
          <ChevronLeft size={14} className="rotate-180" />
          طلباتي
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">طلب #{order.orderNumber}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(order.createdAt).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      <div className="space-y-4">
        {/* Items */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Package size={16} className="text-primary" />
            المنتجات ({order.items.length})
          </h3>
          <div className="divide-y divide-border">
            {order.items.map(item => (
              <div key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <div className="w-14 h-14 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                  {item.productImage ? (
                    <img src={item.productImage} alt="" className="w-full h-full object-contain p-1" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl opacity-30">📦</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-1">{item.productName}</p>
                  {item.variantName && <p className="text-xs text-muted-foreground">{item.variantName}</p>}
                  <p className="text-xs text-muted-foreground mt-0.5">الكمية: {item.quantity}</p>
                </div>
                <span className="text-sm font-bold text-foreground whitespace-nowrap">{formatPrice(item.totalPrice)} د.ع</span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-3">ملخص الأسعار</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>المجموع الفرعي</span>
              <span>{formatPrice(order.subtotalAmount)} د.ع</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>التوصيل</span>
              <span>{formatPrice(order.shippingAmount)} د.ع</span>
            </div>
            {parseFloat(String(order.discountAmount)) > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>الخصم</span>
                <span>-{formatPrice(order.discountAmount)} د.ع</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-foreground pt-2 border-t border-border">
              <span>الإجمالي</span>
              <span className="text-primary">{formatPrice(order.totalAmount)} د.ع</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {order.shippingAddress && (
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              عنوان التوصيل
            </h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">{order.shippingAddress.fullName}</p>
              <p dir="ltr" className="text-right">{order.shippingAddress.phone}</p>
              <p>
                {order.shippingAddress.governorate}، {order.shippingAddress.city}
                {order.shippingAddress.district && `، ${order.shippingAddress.district}`}
                {order.shippingAddress.street && `، ${order.shippingAddress.street}`}
              </p>
            </div>
          </div>
        )}

        {/* Payment */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <CreditCard size={16} className="text-primary" />
            الدفع
          </h3>
          <p className="text-sm text-muted-foreground">
            {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
          </p>
        </div>

        {/* Timeline */}
        {order.timeline && order.timeline.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Truck size={16} className="text-primary" />
              تتبع الطلب
            </h3>
            <div className="space-y-3">
              {order.timeline.map((entry, i) => {
                const entryStatus = STATUS_LABELS[entry.status] || { label: entry.status, color: '' };
                return (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-primary' : 'bg-muted'}`} />
                      {i < order.timeline.length - 1 && <div className="w-0.5 h-full bg-border mt-1" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-foreground">{entryStatus.label}</p>
                      {entry.note && <p className="text-xs text-muted-foreground mt-0.5">{entry.note}</p>}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(entry.createdAt).toLocaleDateString('ar-IQ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-2">ملاحظاتك</h3>
            <p className="text-sm text-muted-foreground">{order.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
