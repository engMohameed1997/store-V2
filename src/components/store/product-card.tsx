'use client';

import Link from 'next/link';
import { ShoppingCart, Heart, Star, Eye, Loader2 } from 'lucide-react';
import type { ProductListItem } from '@/lib/types/store';
import { useState } from 'react';
import { useCartWishlist } from '@/components/providers/cart-wishlist-provider';

interface Props {
  product: ProductListItem;
}

function formatPrice(price: number | string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return num.toLocaleString('ar-IQ');
}

function getDiscount(price: number | string, compareAtPrice: number | string | null): number {
  if (!compareAtPrice) return 0;
  const p = typeof price === 'string' ? parseFloat(price) : price;
  const cp = typeof compareAtPrice === 'string' ? parseFloat(compareAtPrice) : compareAtPrice;
  if (cp <= p) return 0;
  return Math.round(((cp - p) / cp) * 100);
}

export default function ProductCard({ product }: Props) {
  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
  const compareAtPrice = product.compareAtPrice
    ? typeof product.compareAtPrice === 'string' ? parseFloat(product.compareAtPrice) : product.compareAtPrice
    : null;
  const discount = getDiscount(price, compareAtPrice);
  const rating = typeof product.avgRating === 'string' ? parseFloat(product.avgRating) : product.avgRating;
  const primaryImage = product.images?.[0];

  const { addToCart, toggleWishlist, isInWishlist } = useCartWishlist();
  const [addingToCart, setAddingToCart] = useState(false);
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    setAddingToCart(true);
    await addToCart(product.id, 1);
    setAddingToCart(false);
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    await toggleWishlist(product.id);
  };

  return (
    <div className="product-card group">
      {/* Image */}
      <Link
        href={`/products/${product.slug}`}
        className="block relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl overflow-hidden mb-3"
      >
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={primaryImage.alt || product.name}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl opacity-20">
            📦
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {discount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
              -{discount}%
            </span>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
              تبقى {product.stock}
            </span>
          )}
          {product.stock === 0 && (
            <span className="bg-gray-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
              نفذ
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          className={`absolute top-2 left-2 w-8 h-8 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex items-center justify-center transition-all duration-300 shadow-sm ${
            inWishlist
              ? 'text-red-500 bg-red-50 dark:bg-red-950/40 opacity-100'
              : 'text-gray-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20'
          }`}
          title={inWishlist ? 'حذف من المفضلة' : 'إضافة للمفضلة'}
        >
          <Heart size={15} className={inWishlist ? 'fill-red-500 text-red-500' : ''} />
        </button>

        {/* Quick View */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <span className="bg-primary/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
            <Eye size={13} /> عرض سريع
          </span>
        </div>
      </Link>

      {/* Rating */}
      {product.reviewCount > 0 && (
        <div className="flex items-center gap-1 mb-1.5">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={12}
              className={i < Math.floor(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}
            />
          ))}
          <span className="text-xs text-muted-foreground mr-1">({product.reviewCount})</span>
        </div>
      )}

      {/* Name */}
      <Link href={`/products/${product.slug}`} className="block">
        <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-2 min-h-[2.5rem] hover:text-primary transition leading-relaxed">
          {product.nameAr || product.name}
        </h3>
      </Link>

      {/* Brand */}
      {product.brand && (
        <p className="text-xs text-muted-foreground mb-2">{product.brand.name}</p>
      )}

      {/* Price */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-base font-bold text-primary">
          {formatPrice(price)} <span className="text-[10px] font-normal">د.ع</span>
        </span>
        {compareAtPrice && compareAtPrice > price && (
          <span className="text-xs text-muted-foreground line-through">{formatPrice(compareAtPrice)}</span>
        )}
      </div>

      {/* Add to Cart */}
      <button
        onClick={handleAddToCart}
        disabled={product.stock === 0 || addingToCart}
        className="w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed disabled:hover:shadow-none"
      >
        {addingToCart ? <Loader2 size={15} className="animate-spin" /> : <ShoppingCart size={15} />}
        {addingToCart ? 'جاري الإضافة...' : product.stock === 0 ? 'غير متوفر' : 'أضف إلى السلة'}
      </button>
    </div>
  );
}
