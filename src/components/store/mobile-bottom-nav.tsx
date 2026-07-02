'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, ShoppingCart, User, Heart } from 'lucide-react';
import { useCartWishlist } from '@/components/providers/cart-wishlist-provider';

const items = [
  { href: '/', label: 'الرئيسة', icon: Home },
  { href: '/categories', label: 'التصنيفات', icon: LayoutGrid },
  { href: '/cart', label: 'سلّة التّسوّق', icon: ShoppingCart, badgeKey: 'cart' as const },
  { href: '/wishlist', label: 'المفضلة', icon: Heart, badgeKey: 'wishlist' as const },
  { href: '/account', label: 'حسابي', icon: User },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { cartCount, wishlistCount } = useCartWishlist();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex items-stretch justify-around h-16">
        {items.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
          className={`relative flex flex-1 flex-col items-center justify-center gap-1 no-underline transition-colors duration-200 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <span className="relative">
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.4 : 2}
                  className={isActive ? 'fill-primary/10' : ''}
                />
                {item.badgeKey && (item.badgeKey === 'cart' ? cartCount : wishlistCount) > 0 && (
                  <span className="absolute -top-2 -left-2 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {item.badgeKey === 'cart' ? cartCount : wishlistCount}
                  </span>
                )}
              </span>
              <span className={`text-[11px] leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
