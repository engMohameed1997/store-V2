'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ShoppingCart, Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { getJson, postJson, deleteJson, putJson } from '@/lib/client/api';
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

function formatPrice(price: number | string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return num.toLocaleString('ar-IQ');
}

export default function CartPage() {
  const { isAuthenticated, isLoading, accessToken } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCart = useCallback(async () => {
    if (!accessToken) return;
    const res = await getJson<Cart>('/api/v1/cart', { token: accessToken });
    if (res.success) {
      setCart(res.data as Cart);
    }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchCart();
    } else if (!isLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, isLoading, accessToken, fetchCart]);

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!accessToken) return;
    const res = await putJson(`/api/v1/cart/${itemId}`, { quantity }, { token: accessToken });
    if (res.success) {
      fetchCart();
    } else {
      toast.error('حدث خطأ');
    }
  };

  const removeItem = async (itemId: string) => {
    if (!accessToken) return;
    const res = await deleteJson(`/api/v1/cart/${itemId}`, { token: accessToken });
    if (res.success) {
      toast.success('تم الحذف من السلة');
      fetchCart();
    } else {
      toast.error('حدث خطأ');
    }
  };

  const clearCart = async () => {
    if (!accessToken) return;
    const res = await deleteJson('/api/v1/cart', { token: accessToken });
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

  const items = cart?.items || [];
  const total = items.reduce((sum, item) => {
    const itemPrice = item.variant
      ? (typeof item.variant.price === 'string' ? parseFloat(item.variant.price) : item.variant.price)
      : (typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price);
    return sum + itemPrice * item.quantity;
  }, 0);

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
                <span>يُحسب لاحقاً</span>
              </div>
            </div>
            <div className="border-t border-border pt-3 mb-4">
              <div className="flex justify-between font-bold text-foreground">
                <span>الإجمالي</span>
                <span className="text-primary">{formatPrice(total)} د.ع</span>
              </div>
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
