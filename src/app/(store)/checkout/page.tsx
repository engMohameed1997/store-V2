'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { MapPin, CreditCard, FileText, ChevronLeft, Plus, Loader2, CheckCircle2, Ticket, X } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { getJson, postJson } from '@/lib/client/api';
import { useCouponStore } from '@/stores/coupon-store';
import { formatPrice } from '@/lib/utils/format';
import { toast } from 'sonner';

interface Address {
  id: string;
  fullName: string;
  phone: string;
  governorate: string;
  city: string;
  district: string | null;
  street: string | null;
  landmark: string | null;
  isDefault: boolean;
}

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    nameAr: string | null;
    slug: string;
    price: number | string;
    images: { url: string; alt: string | null }[];
  };
  variant: {
    id: string;
    name: string;
    price: number | string;
  } | null;
}

interface Cart {
  id: string;
  items: CartItem[];
}

interface CheckoutSummary {
  subtotal: number;
  discount: number;
  shipping: number | null;
  total: number;
  isFreeShipping: boolean;
}

const PAYMENT_METHODS = [
  { value: 'CASH_ON_DELIVERY', label: 'الدفع عند الاستلام', icon: '💵' },
  { value: 'ZAIN_CASH', label: 'زين كاش', icon: '📱' },
  { value: 'QI_CARD', label: 'كي كارد', icon: '💳' },
  { value: 'FAST_PAY', label: 'فاست باي', icon: '⚡' },
];

export default function CheckoutPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('CASH_ON_DELIVERY');
  const [notes, setNotes] = useState('');

  const { couponCode, clearCoupon } = useCouponStore();
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    const [cartRes, addrRes] = await Promise.all([
      getJson<Cart>('/api/v1/cart'),
      getJson<Address[]>('/api/v1/addresses'),
    ]);

    if (cartRes.success) setCart(cartRes.data as Cart);
    if (addrRes.success) {
      const addrs = addrRes.data as Address[];
      setAddresses(addrs);
      const defaultAddr = addrs.find(a => a.isDefault);
      if (defaultAddr) setSelectedAddress(defaultAddr.id);
      else if (addrs.length > 0) setSelectedAddress(addrs[0].id);
    }
    setLoading(false);
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    } else if (!isLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, isLoading, fetchData]);

  // Fetch checkout summary from server
  const fetchSummary = useCallback(async () => {
    if (!isAuthenticated) return;
    setSummaryLoading(true);
    const res = await postJson<CheckoutSummary>('/api/v1/checkout/summary', {
      couponCode: couponCode || undefined,
    });
    setSummaryLoading(false);
    if (res.success && res.data) {
      setSummary(res.data as CheckoutSummary);
    }
  }, [isAuthenticated, couponCode]);

  useEffect(() => {
    if (isAuthenticated && !loading) {
      fetchSummary();
    }
  }, [isAuthenticated, loading, fetchSummary]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAddress) {
      toast.error('يرجى اختيار عنوان التوصيل');
      return;
    }
    if (!cart?.items?.length) {
      toast.error('السلة فارغة');
      return;
    }

    setSubmitting(true);
    const res = await postJson<{ id: string }>('/api/v1/orders', {
      shippingAddressId: selectedAddress,
      paymentMethod,
      couponCode: couponCode || undefined,
      notes: notes.trim() || undefined,
    });

    setSubmitting(false);

    if (res.success) {
      clearCoupon();
      setOrderSuccess(true);
      setOrderId(res.data?.id || null);
      toast.success('تم إنشاء الطلب بنجاح!');
    } else {
      toast.error(!res.success ? res.error.message : 'حدث خطأ أثناء إنشاء الطلب');
    }
  };

  if (isLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Loader2 size={32} className="mx-auto animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-sm">جاري التحميل...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <CreditCard size={48} className="mx-auto text-muted-foreground/30 mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">إتمام الطلب</h1>
        <p className="text-muted-foreground text-sm mb-6">يرجى تسجيل الدخول أولاً</p>
        <Link href="/login" className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition">
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md">
        <div className="bg-card rounded-2xl border border-border p-8">
          <CheckCircle2 size={56} className="mx-auto text-emerald-500 mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">تم تأكيد الطلب!</h1>
          <p className="text-muted-foreground text-sm mb-6">شكراً لك. سيتم التواصل معك قريباً لتأكيد التوصيل.</p>
          <div className="flex flex-col gap-3">
            {orderId && (
              <Link
                href={`/account/orders/${orderId}`}
                className="block w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition"
              >
                متابعة الطلب
              </Link>
            )}
            <Link
              href="/"
              className="block w-full py-2.5 border border-border rounded-xl font-medium text-foreground hover:bg-muted transition"
            >
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const items = cart?.items || [];
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <CreditCard size={48} className="mx-auto text-muted-foreground/30 mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">السلة فارغة</h1>
        <p className="text-muted-foreground text-sm mb-6">أضف منتجات إلى السلة أولاً</p>
        <Link href="/products" className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition">
          تصفح المنتجات
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition">الرئيسية</Link>
        <ChevronLeft size={14} />
        <Link href="/cart" className="hover:text-primary transition">السلة</Link>
        <ChevronLeft size={14} />
        <span className="text-foreground font-medium">إتمام الطلب</span>
      </nav>

      <h1 className="text-2xl font-bold text-foreground mb-6">إتمام الطلب</h1>

      <form onSubmit={handleSubmitOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Address + Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-foreground flex items-center gap-2">
                  <MapPin size={18} className="text-primary" />
                  عنوان التوصيل
                </h2>
                <Link href="/account/addresses" className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Plus size={12} />
                  إضافة عنوان
                </Link>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground text-sm mb-3">لا توجد عناوين محفوظة</p>
                  <Link href="/account/addresses" className="text-primary text-sm hover:underline">
                    أضف عنوان جديد
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {addresses.map(addr => (
                    <label
                      key={addr.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                        selectedAddress === addr.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={addr.id}
                        checked={selectedAddress === addr.id}
                        onChange={() => setSelectedAddress(addr.id)}
                        className="mt-1 w-4 h-4 text-primary"
                      />
                      <div className="text-sm">
                        <p className="font-medium text-foreground">{addr.fullName}</p>
                        <p className="text-muted-foreground text-xs mt-0.5" dir="ltr">{addr.phone}</p>
                        <p className="text-muted-foreground text-xs mt-0.5">
                          {addr.governorate}، {addr.city}
                          {addr.district && `، ${addr.district}`}
                          {addr.street && `، ${addr.street}`}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="font-bold text-foreground flex items-center gap-2 mb-4">
                <CreditCard size={18} className="text-primary" />
                طريقة الدفع
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(method => (
                  <label
                    key={method.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                      paymentMethod === method.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.value}
                      checked={paymentMethod === method.value}
                      onChange={() => setPaymentMethod(method.value)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-lg">{method.icon}</span>
                    <span className="text-sm font-medium text-foreground">{method.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-card rounded-xl border border-border p-5 space-y-4">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <FileText size={18} className="text-primary" />
                ملاحظات إضافية
              </h2>

              {/* Coupon badge (from Store) */}
              {couponCode && (
                <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-2 text-sm">
                    <Ticket size={16} className="text-emerald-600" />
                    <span className="text-emerald-700 dark:text-emerald-400">
                      كود الخصم: {couponCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      clearCoupon();
                      toast.success('تم إزالة كود الخصم');
                    }}
                    className="text-red-500 hover:text-red-600 p-1 rounded transition"
                    title="إزالة"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">ملاحظات على الطلب (اختياري)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="أي تعليمات خاصة بالتوصيل..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition text-sm resize-none"
                />
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border p-5 sticky top-20">
              <h3 className="font-bold text-foreground mb-4">ملخص الطلب</h3>

              {/* Items */}
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {items.map(item => {
                  const p = item.variant
                    ? (typeof item.variant.price === 'string' ? parseFloat(item.variant.price) : item.variant.price)
                    : (typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price);
                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                        {item.product.images?.[0] ? (
                          <img src={item.product.images[0].url} alt="" className="w-full h-full object-contain p-1" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg opacity-30">📦</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground line-clamp-1">{item.product.nameAr || item.product.name}</p>
                        <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                      </div>
                      <span className="text-xs font-medium text-foreground whitespace-nowrap">{formatPrice(p * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm border-t border-border pt-3 mb-4">
                {summaryLoading ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 size={16} className="animate-spin text-muted-foreground" />
                  </div>
                ) : summary ? (
                  <>
                    <div className="flex justify-between text-muted-foreground">
                      <span>المجموع الفرعي ({items.length} منتج)</span>
                      <span>{formatPrice(summary.subtotal)} د.ع</span>
                    </div>
                    {summary.discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>الخصم</span>
                        <span>-{formatPrice(summary.discount)} د.ع</span>
                      </div>
                    )}
                    <div className="flex justify-between text-muted-foreground">
                      <span>التوصيل</span>
                      <span>
                        {summary.shipping === null
                          ? 'يُحسب لاحقاً'
                          : summary.isFreeShipping
                            ? 'شحن مجاني'
                            : `${formatPrice(summary.shipping)} د.ع`}
                      </span>
                    </div>
                  </>
                ) : null}
              </div>

              <div className="border-t border-border pt-3 mb-5">
                <div className="flex justify-between font-bold text-foreground">
                  <span>الإجمالي</span>
                  <span className="text-primary text-lg">
                    {summary ? formatPrice(summary.total) : '—'} د.ع
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedAddress}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    جاري إنشاء الطلب...
                  </>
                ) : (
                  'تأكيد الطلب'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
