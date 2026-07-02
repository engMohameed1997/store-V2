'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ShoppingCart, Trash2, Minus, Plus, ShoppingBag, Ticket, CheckCircle2, XCircle, X } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { getJson, postJson, deleteJson, putJson } from '@/lib/client/api';
import { useCouponStore } from '@/stores/coupon-store';
import { formatPrice } from '@/lib/utils/format';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    nameAr: string | null;
    slug: string;
    price: number | string;
    stock: number;
    images: { url: string; alt: string | null }[];
    category?: { id: string; name: string; slug: string } | null;
  };
  variant: {
    id: string;
    name: string;
    price: number | string;
  } | null;
}

interface CouponPreview {
  code: string;
  discountAmount: number;
  discountType: string;
  isFreeShipping: boolean;
}

interface Cart {
  id: string;
  items: CartItem[];
}

export default function CartPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  const { couponCode, setCoupon, clearCoupon } = useCouponStore();
  const [couponInput, setCouponInput] = useState('');
  const [couponPreview, setCouponPreview] = useState<CouponPreview | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const revalidateRef = useRef(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) return;
    const res = await getJson<Cart>('/api/v1/cart');
    if (res.success) {
      setCart(res.data as Cart);
    }
    setLoading(false);
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else if (!isLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, isLoading, fetchCart]);

  const items = cart?.items || [];
  const total = items.reduce((sum, item) => {
    const itemPrice = item.variant
      ? (typeof item.variant.price === 'string' ? parseFloat(item.variant.price) : item.variant.price)
      : (typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price);
    return sum + itemPrice * item.quantity;
  }, 0);

  const applyCoupon = useCallback(async (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setCouponLoading(true);
    setCouponError(null);

    const couponItems = items.map(i => ({
      productId: i.product.id,
      categoryId: i.product.category?.id ?? null,
      price: i.variant
        ? (typeof i.variant.price === 'string' ? parseFloat(i.variant.price) : i.variant.price)
        : (typeof i.product.price === 'string' ? parseFloat(i.product.price) : i.product.price),
      quantity: i.quantity,
    }));

    const res = await postJson<CouponPreview>('/api/v1/coupons/validate', {
      code: trimmed,
      items: couponItems,
    });

    setCouponLoading(false);

    if (res.success && res.data) {
      const preview = res.data as CouponPreview;
      setCouponPreview(preview);
      setCoupon(trimmed);
      toast.success(`تم تطبيق كود الخصم: ${trimmed}`);
    } else {
      const msg = !res.success ? res.error.message : 'فشل التحقق من الكود';
      setCouponError(msg);
      setCouponPreview(null);
      clearCoupon();
      toast.error(msg);
    }
  }, [items, setCoupon, clearCoupon]);

  const removeCoupon = useCallback(() => {
    setCouponPreview(null);
    clearCoupon();
    setCouponInput('');
    setCouponError(null);
  }, [clearCoupon]);

  // Re-validate coupon when cart changes
  useEffect(() => {
    if (!couponCode || items.length === 0) return;
    if (!revalidateRef.current) {
      revalidateRef.current = true;
      return;
    }

    const revalidate = async () => {
      const couponItems = items.map(i => ({
        productId: i.product.id,
        categoryId: i.product.category?.id ?? null,
        price: i.variant
          ? (typeof i.variant.price === 'string' ? parseFloat(i.variant.price) : i.variant.price)
          : (typeof i.product.price === 'string' ? parseFloat(i.product.price) : i.product.price),
        quantity: i.quantity,
      }));

      const res = await postJson<CouponPreview>('/api/v1/coupons/validate', {
        code: couponCode,
        items: couponItems,
      });

      if (!res.success) {
        setCouponPreview(null);
        clearCoupon();
        toast.error('تم إزالة الكوبون لأن محتويات السلة تغيرت');
      } else if (res.data) {
        setCouponPreview(res.data as CouponPreview);
      }
    };

    revalidate();
  }, [items, couponCode, clearCoupon]);

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!isAuthenticated) return;
    const res = await putJson(`/api/v1/cart/${itemId}`, { quantity });
    if (res.success) {
      fetchCart();
    } else {
      toast.error('حدث خطأ');
    }
  };

  const removeItem = async (itemId: string) => {
    if (!isAuthenticated) return;
    const res = await deleteJson(`/api/v1/cart/${itemId}`);
    if (res.success) {
      toast.success('تم الحذف من السلة');
      fetchCart();
    } else {
      toast.error('حدث خطأ');
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return;
    const res = await deleteJson('/api/v1/cart');
    if (res.success) {
      setCart(null);
      toast.success('تم تفريغ السلة');
    }
  };

  if (isLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mx-auto mb-4" />
          <div className="h-4 bg-muted rounded w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingCart size={48} className="mx-auto text-muted-foreground/30 mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">سلة التسوق</h1>
        <p className="text-muted-foreground text-sm mb-6">يرجى تسجيل الدخول لعرض سلة التسوق</p>
        <Link href="/login" className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition">
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag size={48} className="mx-auto text-muted-foreground/30 mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">السلة فارغة</h1>
        <p className="text-muted-foreground text-sm mb-6">لم تقم بإضافة أي منتجات بعد</p>
        <Link href="/products" className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition">
          تصفح المنتجات
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">سلة التسوق ({items.length})</h1>
        <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-600 transition flex items-center gap-1">
          <Trash2 size={14} />
          تفريغ السلة
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => {
            const itemPrice = item.variant
              ? (typeof item.variant.price === 'string' ? parseFloat(item.variant.price) : item.variant.price)
              : (typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price);

            return (
              <div key={item.id} className="flex gap-4 p-4 bg-card rounded-xl border border-border">
                {/* Image */}
                <Link href={`/products/${item.product.slug}`} className="w-20 h-20 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                  {item.product.images?.[0] ? (
                    <img src={item.product.images[0].url} alt={item.product.images[0].alt || ''} className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">📦</div>
                  )}
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.product.slug}`} className="text-sm font-medium text-foreground hover:text-primary transition line-clamp-2">
                    {item.product.nameAr || item.product.name}
                  </Link>
                  {item.variant && (
                    <p className="text-xs text-muted-foreground mt-0.5">{item.variant.name}</p>
                  )}
                  <p className="text-sm font-bold text-primary mt-1">{formatPrice(itemPrice)} د.ع</p>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-border rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-8 h-8 flex items-center justify-center hover:bg-muted transition"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 h-8 flex items-center justify-center text-sm font-semibold border-x border-border">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-muted transition"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-600 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition"
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl border border-border p-5 sticky top-20">
            <h3 className="font-bold text-foreground mb-4">ملخص الطلب</h3>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-muted-foreground">
                <span>المجموع الفرعي</span>
                <span>{formatPrice(total)} د.ع</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>التوصيل</span>
                <span>
                  {couponPreview?.isFreeShipping
                    ? 'شحن مجاني'
                    : 'يُحسب لاحقاً'}
                </span>
              </div>
              {couponPreview && couponPreview.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>الخصم</span>
                  <span>-{formatPrice(couponPreview.discountAmount)} د.ع</span>
                </div>
              )}
            </div>
            <div className="border-t border-border pt-3 mb-4">
              <div className="flex justify-between font-bold text-foreground">
                <span>الإجمالي</span>
                <span className="text-primary">
                  {formatPrice(
                    couponPreview
                      ? Math.max(0, total - couponPreview.discountAmount)
                      : total
                  )} د.ع
                </span>
              </div>
            </div>

            {/* Coupon Input */}
            <div className="border-t border-border pt-4 mb-4">
              <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
                <Ticket size={16} className="text-primary" />
                كود الخصم
              </label>
              {couponPreview ? (
                <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span className="text-emerald-700 dark:text-emerald-400">
                      تم تطبيق خصم {formatPrice(couponPreview.discountAmount)} د.ع
                    </span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-red-500 hover:text-red-600 p-1 rounded transition"
                    title="إزالة"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        applyCoupon(couponInput);
                      }
                    }}
                    placeholder="أدخل الكود"
                    disabled={couponLoading}
                    className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition text-sm disabled:opacity-50"
                  />
                  <button
                    onClick={() => applyCoupon(couponInput)}
                    disabled={couponLoading || !couponInput.trim()}
                    className="px-4 h-10 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {couponLoading ? '...' : 'تطبيق'}
                  </button>
                </div>
              )}
              {couponError && (
                <div className="flex items-center gap-1.5 mt-2 text-sm text-red-500">
                  <XCircle size={14} />
                  <span>{couponError}</span>
                </div>
              )}
            </div>

            <Link
              href="/checkout"
              className="block w-full py-3 bg-primary text-primary-foreground text-center rounded-xl font-bold hover:bg-primary/90 transition"
            >
              إتمام الطلب
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
