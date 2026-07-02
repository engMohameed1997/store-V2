'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  ArrowRight,
  Loader2,
  AlertCircle,
  Printer,
} from 'lucide-react';
import { useAdminClient } from '@/hooks/use-admin-client';
import type { AdminOrder } from '@/lib/client/admin';
import { formatPrice } from '@/lib/utils/format';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ar-IQ', {
    year: 'numeric',
    month: 'long',
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

const PAYMENT_LABELS: Record<string, string> = {
  PENDING: 'بانتظار الدفع',
  PAID: 'مدفوع',
  FAILED: 'فشل الدفع',
  REFUNDED: 'مسترجع',
};

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const client = useAdminClient();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrder = useCallback(async () => {
    if (!client || !id) return;
    setLoading(true);
    try {
      const result = await client.orders.get(id);
      if (result.success) {
        setOrder(result.data as unknown as AdminOrder);
      } else if (!result.success) {
        setError(result.error.message);
      }
    } catch {
      setError('فشل في تحميل بيانات الطلب');
    } finally {
      setLoading(false);
    }
  }, [client, id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-20">
        <AlertCircle size={48} className="mx-auto mb-3 text-red-500 opacity-60" />
        <p className="text-red-500 text-sm">{error || 'الطلب غير موجود'}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 text-sm text-primary hover:underline"
        >
          رجوع
        </button>
      </div>
    );
  }

  const orderAny = order as any;

  return (
    <div>
      {/* Header — hidden in print */}
      <div className="flex items-center gap-3 mb-6 print:hidden">
        <Link
          href={`/mx-panel/orders/${id}`}
          className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted transition"
        >
          <ArrowRight size={18} />
        </Link>
        <FileText size={24} className="text-primary" />
        <h1 className="text-2xl font-bold text-foreground">فاتورة الطلب</h1>
        <div className="mr-auto">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition"
          >
            <Printer size={16} />
            طباعة الفاتورة
          </button>
        </div>
      </div>

      {/* Invoice Content */}
      <div
        ref={printRef}
        className="bg-white text-black rounded-2xl border border-border p-8 print:border-none print:rounded-none print:p-4 print:shadow-none max-w-3xl mx-auto"
        dir="rtl"
      >
        {/* Invoice Header */}
        <div className="flex items-start justify-between border-b-2 border-gray-800 pb-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900">فاتورة</h2>
            <p className="text-sm text-gray-500 mt-1">رقم الطلب: {order.orderNumber}</p>
            <p className="text-sm text-gray-500">التاريخ: {formatDate(order.createdAt)}</p>
          </div>
          <div className="text-left">
            <div className="w-12 h-12 rounded-lg bg-gray-900 flex items-center justify-center mb-2">
              <span className="text-white font-black text-lg">M</span>
            </div>
            <p className="text-xs text-gray-500">المتجر</p>
          </div>
        </div>

        {/* Customer + Status */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">معلومات العميل</h3>
            {order.user && (
              <div className="text-sm text-gray-700 space-y-0.5">
                <p className="font-semibold text-gray-900">
                  {order.user.firstName} {order.user.lastName}
                </p>
                {order.user.email && <p>{order.user.email}</p>}
                {orderAny.user?.phone && <p dir="ltr" className="text-left">{orderAny.user.phone}</p>}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">حالة الطلب</h3>
            <div className="text-sm space-y-0.5">
              <p>
                <span className="text-gray-500">الحالة: </span>
                <span className="font-semibold text-gray-900">
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </p>
              <p>
                <span className="text-gray-500">الدفع: </span>
                <span className="font-semibold text-gray-900">
                  {PAYMENT_LABELS[order.paymentStatus] || order.paymentStatus}
                </span>
              </p>
              <p>
                <span className="text-gray-500">طريقة الدفع: </span>
                <span className="font-semibold text-gray-900">
                  {order.paymentMethod === 'CASH_ON_DELIVERY' ? 'الدفع عند الاستلام' : order.paymentMethod}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {orderAny.shippingAddress && (
          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">عنوان التوصيل</h3>
            <p className="text-sm text-gray-700">
              {orderAny.shippingAddress.governorate}
              {orderAny.shippingAddress.district && ` - ${orderAny.shippingAddress.district}`}
              {orderAny.shippingAddress.area && ` - ${orderAny.shippingAddress.area}`}
            </p>
            {orderAny.shippingAddress.street && (
              <p className="text-sm text-gray-700">{orderAny.shippingAddress.street}</p>
            )}
            {orderAny.shippingAddress.nearestLandmark && (
              <p className="text-sm text-gray-500">أقرب معلم: {orderAny.shippingAddress.nearestLandmark}</p>
            )}
          </div>
        )}

        {/* Items Table */}
        <table className="w-full mb-6">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-right text-xs font-bold text-gray-500 py-2 pb-3">#</th>
              <th className="text-right text-xs font-bold text-gray-500 py-2 pb-3">المنتج</th>
              <th className="text-center text-xs font-bold text-gray-500 py-2 pb-3">الكمية</th>
              <th className="text-left text-xs font-bold text-gray-500 py-2 pb-3">السعر</th>
              <th className="text-left text-xs font-bold text-gray-500 py-2 pb-3">المجموع</th>
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map((item, idx) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-3 text-sm text-gray-500">{idx + 1}</td>
                <td className="py-3">
                  <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                </td>
                <td className="py-3 text-center text-sm text-gray-700">{item.quantity}</td>
                <td className="py-3 text-left text-sm text-gray-700">
                  {formatPrice(item.price)} د.ع
                </td>
                <td className="py-3 text-left text-sm font-semibold text-gray-900">
                  {formatPrice(item.totalPrice)} د.ع
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">المجموع الفرعي</span>
              <span className="text-gray-900">{formatPrice(order.subtotal)} د.ع</span>
            </div>
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">الخصم</span>
                <span className="text-green-600">-{formatPrice(order.discountAmount)} د.ع</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">التوصيل</span>
              <span className="text-gray-900">
                {Number(order.shippingCost) === 0
                  ? 'مجاني'
                  : `${formatPrice(order.shippingCost)} د.ع`}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold border-t-2 border-gray-800 pt-2 mt-2">
              <span className="text-gray-900">الإجمالي</span>
              <span className="text-gray-900">{formatPrice(order.totalAmount)} د.ع</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">شكراً لتسوقكم معنا</p>
          <p className="text-xs text-gray-400 mt-1">
            تم إنشاء هذه الفاتورة تلقائياً • {formatDate(new Date().toISOString())}
          </p>
        </div>
      </div>

      {/* Print-only styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          [dir="rtl"] {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          [dir="rtl"] * {
            visibility: visible;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}</style>
    </div>
  );
}
