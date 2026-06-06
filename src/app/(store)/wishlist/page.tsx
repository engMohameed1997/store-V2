'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { getJson, postJson } from '@/lib/client/api';
import { toast } from 'sonner';

interface WishlistItem {
  id: string;
  product: {
    id: string;
    name: string;
    nameAr: string | null;
    slug: string;
    price: number | string;
    compareAtPrice: number | string | null;
    stock: number;
    images: { url: string; alt: string | null }[];
    brand: { name: string } | null;
  };
}

function formatPrice(price: number | string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return num.toLocaleString('ar-IQ');
}

export default function WishlistPage() {
  const { isAuthenticated, isLoading, accessToken } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    if (!accessToken) return;
    const res = await getJson<WishlistItem[]>('/api/v1/wishlist', { token: accessToken });
    if (res.success) {
      setItems(res.data as WishlistItem[]);
    }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchWishlist();
    } else if (!isLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, isLoading, accessToken, fetchWishlist]);

  const removeFromWishlist = async (productId: string) => {
    if (!accessToken) return;
    const res = await postJson('/api/v1/wishlist', { productId }, { token: accessToken });
    if (res.success) {
      setItems(prev => prev.filter(item => item.product.id !== productId));
      toast.success('تم الحذف من المفضلة');
    }
  };

  const addToCart = async (productId: string) => {
    if (!accessToken) return;
    const res = await postJson('/api/v1/cart', { productId, quantity: 1 }, { token: accessToken });
    if (res.success) {
      toast.success('تمت الإضافة إلى السلة');
    } else {
      toast.error('حدث خطأ');
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
        <Heart size={48} className="mx-auto text-muted-foreground/30 mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">المفضلة</h1>
        <p className="text-muted-foreground text-sm mb-6">يرجى تسجيل الدخول لعرض قائمة المفضلة</p>
        <Link href="/login" className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition">
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Heart size={48} className="mx-auto text-muted-foreground/30 mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">المفضلة فارغة</h1>
        <p className="text-muted-foreground text-sm mb-6">لم تقم بإضافة أي منتجات بعد</p>
        <Link href="/products" className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition">
          تصفح المنتجات
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">المفضلة ({items.length})</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map(item => {
          const price = typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price;
          const compareAt = item.product.compareAtPrice
            ? (typeof item.product.compareAtPrice === 'string' ? parseFloat(item.product.compareAtPrice) : item.product.compareAtPrice)
            : null;

          return (
            <div key={item.id} className="bg-card rounded-xl border border-border p-4 group">
              {/* Image */}
              <Link href={`/products/${item.product.slug}`} className="block aspect-square bg-muted rounded-lg overflow-hidden mb-3">
                {item.product.images?.[0] ? (
                  <img src={item.product.images[0].url} alt={item.product.images[0].alt || ''} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">📦</div>
                )}
              </Link>

              {/* Info */}
              <Link href={`/products/${item.product.slug}`}>
                <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-1 hover:text-primary transition min-h-[2.5rem]">
                  {item.product.nameAr || item.product.name}
                </h3>
              </Link>
              {item.product.brand && (
                <p className="text-xs text-muted-foreground mb-2">{item.product.brand.name}</p>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-base font-bold text-primary">{formatPrice(price)} <span className="text-[10px]">د.ع</span></span>
                {compareAt && compareAt > price && (
                  <span className="text-xs text-muted-foreground line-through">{formatPrice(compareAt)}</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => addToCart(item.product.id)}
                  disabled={item.product.stock === 0}
                  className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-primary/90 transition disabled:opacity-50"
                >
                  <ShoppingCart size={14} />
                  {item.product.stock === 0 ? 'نفد' : 'أضف للسلة'}
                </button>
                <button
                  onClick={() => removeFromWishlist(item.product.id)}
                  className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition"
                  title="حذف من المفضلة"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
