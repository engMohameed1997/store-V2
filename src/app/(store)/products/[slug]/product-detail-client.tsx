'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Heart, Star, Minus, Plus, ChevronLeft, ChevronRight, Share2, Shield, Truck, RefreshCw } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { postJson } from '@/lib/client/api';
import { toast } from 'sonner';

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
}

interface ProductSpec {
  id: string;
  key: string;
  value: string;
}

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number | string;
  stock: number;
  attributes: { option: { name: string }; value: string }[];
}

interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  nameAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  price: number | string;
  compareAtPrice: number | string | null;
  stock: number;
  avgRating: number | string;
  reviewCount: number;
  soldCount: number;
  isFeatured: boolean;
  images: ProductImage[];
  specs: ProductSpec[];
  variants: ProductVariant[];
  category: { id: string; name: string; slug: string } | null;
  brand: { id: string; name: string; slug: string } | null;
}

function formatPrice(price: number | string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return num.toLocaleString('ar-IQ');
}

export default function ProductDetailClient({ product }: { product: ProductDetail }) {
  const { isAuthenticated, accessToken } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(
    product.variants.length > 0 ? product.variants[0].id : null
  );
  const [addingToCart, setAddingToCart] = useState(false);

  // Keyboard navigation for the image slider
  useEffect(() => {
    if (product.images.length <= 1) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setSelectedImage(i => Math.min(product.images.length - 1, i + 1));
      if (e.key === 'ArrowRight') setSelectedImage(i => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [product.images.length]);

  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
  const compareAtPrice = product.compareAtPrice
    ? typeof product.compareAtPrice === 'string' ? parseFloat(product.compareAtPrice) : product.compareAtPrice
    : null;
  const discount = compareAtPrice && compareAtPrice > price
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;
  const rating = typeof product.avgRating === 'string' ? parseFloat(product.avgRating) : product.avgRating;

  const activeVariant = product.variants.find(v => v.id === selectedVariant);
  const currentPrice = activeVariant
    ? (typeof activeVariant.price === 'string' ? parseFloat(activeVariant.price) : activeVariant.price)
    : price;
  const currentStock = activeVariant ? activeVariant.stock : product.stock;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('يرجى تسجيل الدخول أولاً');
      return;
    }
    setAddingToCart(true);
    const res = await postJson('/api/v1/cart', {
      productId: product.id,
      variantId: selectedVariant,
      quantity,
    }, { token: accessToken! });
    setAddingToCart(false);
    if (res.success) {
      toast.success('تمت الإضافة إلى السلة');
    } else {
      toast.error(!res.success ? res.error.message : 'حدث خطأ');
    }
  };

  const handleAddToWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('يرجى تسجيل الدخول أولاً');
      return;
    }
    const res = await postJson('/api/v1/wishlist', { productId: product.id }, { token: accessToken! });
    if (res.success) {
      toast.success('تمت إضافته إلى المفضلة');
    } else {
      toast.error('حدث خطأ');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition">الرئيسية</Link>
        <ChevronLeft size={14} />
        <Link href="/products" className="hover:text-primary transition">المنتجات</Link>
        {product.category && (
          <>
            <ChevronLeft size={14} />
            <Link href={`/category/${product.category.slug}`} className="hover:text-primary transition">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronLeft size={14} />
        <span className="text-foreground font-medium truncate max-w-[200px]">{product.nameAr || product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div>
          <div className="relative aspect-square bg-card rounded-2xl border border-border overflow-hidden mb-4">
            {product.images.length > 0 ? (
              <img
                src={product.images[selectedImage]?.url}
                alt={product.images[selectedImage]?.alt || product.name}
                className="w-full h-full object-contain p-8"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl opacity-20">📦</div>
            )}

            {/* Slider Navigation — shown only when multiple images exist */}
            {product.images.length > 1 && (
              <>
                {/* Previous image (right side — RTL direction) */}
                <button
                  onClick={() => setSelectedImage(i => Math.max(0, i - 1))}
                  disabled={selectedImage === 0}
                  aria-label="الصورة السابقة"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 border border-border shadow flex items-center justify-center hover:bg-background transition disabled:opacity-30 z-10"
                >
                  <ChevronRight size={18} />
                </button>

                {/* Next image (left side — RTL direction) */}
                <button
                  onClick={() => setSelectedImage(i => Math.min(product.images.length - 1, i + 1))}
                  disabled={selectedImage === product.images.length - 1}
                  aria-label="الصورة التالية"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 border border-border shadow flex items-center justify-center hover:bg-background transition disabled:opacity-30 z-10"
                >
                  <ChevronLeft size={18} />
                </button>

                {/* Image counter */}
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-background/80 text-foreground text-xs font-medium px-2.5 py-1 rounded-full border border-border select-none">
                  {selectedImage + 1} / {product.images.length}
                </span>
              </>
            )}

            {discount > 0 && (
              <span className="absolute top-4 right-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-lg">
                -{discount}%
              </span>
            )}
          </div>
          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-lg border-2 overflow-hidden flex-shrink-0 transition ${
                    i === selectedImage ? 'border-primary' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <img src={img.url} alt={img.alt || ''} className="w-full h-full object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {/* Brand */}
          {product.brand && (
            <Link href={`/products?brand=${product.brand.slug}`} className="text-sm text-primary font-medium hover:underline">
              {product.brand.name}
            </Link>
          )}

          {/* Name */}
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-2 mb-3 leading-relaxed">
            {product.nameAr || product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className={i < Math.floor(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">({product.reviewCount} تقييم)</span>
            <span className="text-sm text-muted-foreground">• {product.soldCount} مبيعات</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6 p-4 bg-card rounded-xl border border-border">
            <span className="text-3xl font-black text-primary">
              {formatPrice(currentPrice)}
            </span>
            <span className="text-sm text-muted-foreground">د.ع</span>
            {compareAtPrice && compareAtPrice > price && (
              <span className="text-lg text-muted-foreground line-through mr-2">{formatPrice(compareAtPrice)}</span>
            )}
          </div>

          {/* Variants */}
          {product.variants.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-semibold text-foreground mb-2">اختر النوع:</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map(variant => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant.id)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                      selectedVariant === variant.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-foreground hover:border-primary/50'
                    } ${variant.stock === 0 ? 'opacity-50 line-through' : ''}`}
                    disabled={variant.stock === 0}
                  >
                    {variant.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-6">
            <p className="text-sm font-semibold text-foreground">الكمية:</p>
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center hover:bg-muted transition"
              >
                <Minus size={16} />
              </button>
              <span className="w-12 h-10 flex items-center justify-center font-semibold text-foreground border-x border-border">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                className="w-10 h-10 flex items-center justify-center hover:bg-muted transition"
              >
                <Plus size={16} />
              </button>
            </div>
            <span className="text-sm text-muted-foreground">
              {currentStock > 0 ? `(${currentStock} متوفر)` : 'غير متوفر'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={handleAddToCart}
              disabled={currentStock === 0 || addingToCart}
              className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={18} />
              {addingToCart ? 'جاري الإضافة...' : currentStock === 0 ? 'غير متوفر' : 'أضف إلى السلة'}
            </button>
            <button
              onClick={handleAddToWishlist}
              className="w-12 h-12 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-red-50 hover:border-red-200 hover:text-red-500 dark:hover:bg-red-900/10 transition-all"
              title="إضافة للمفضلة"
            >
              <Heart size={20} />
            </button>
            <button
              className="w-12 h-12 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-muted transition"
              title="مشاركة"
            >
              <Share2 size={18} />
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="flex flex-col items-center gap-1.5 p-3 bg-card rounded-xl border border-border text-center">
              <Truck size={20} className="text-primary" />
              <span className="text-xs text-foreground font-medium">توصيل سريع</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3 bg-card rounded-xl border border-border text-center">
              <Shield size={20} className="text-emerald-500" />
              <span className="text-xs text-foreground font-medium">ضمان أصلي</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3 bg-card rounded-xl border border-border text-center">
              <RefreshCw size={20} className="text-amber-500" />
              <span className="text-xs text-foreground font-medium">إرجاع سهل</span>
            </div>
          </div>

          {/* Specs */}
          {product.specs.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="font-bold text-foreground mb-3">المواصفات</h3>
              <div className="divide-y divide-border">
                {product.specs.map(spec => (
                  <div key={spec.id} className="flex justify-between py-2.5 text-sm">
                    <span className="text-muted-foreground">{spec.key}</span>
                    <span className="text-foreground font-medium">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {(product.descriptionAr || product.description) && (
            <div className="mt-6 bg-card rounded-xl border border-border p-4">
              <h3 className="font-bold text-foreground mb-3">وصف المنتج</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {product.descriptionAr || product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
