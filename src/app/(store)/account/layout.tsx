'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Package, Heart, MapPin, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';

const navItems = [
  { href: '/account', label: 'الملف الشخصي', icon: User },
  { href: '/account/orders', label: 'طلباتي', icon: Package },
  { href: '/wishlist', label: 'المفضلة', icon: Heart },
  { href: '/account/addresses', label: 'العناوين', icon: MapPin },
  { href: '/account/settings', label: 'الإعدادات', icon: Settings },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  if (isLoading) {
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
        <User size={48} className="mx-auto text-muted-foreground/30 mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">حسابي</h1>
        <p className="text-muted-foreground text-sm mb-6">يرجى تسجيل الدخول للوصول إلى حسابك</p>
        <Link href="/login" className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition">
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="bg-card rounded-xl border border-border p-4 sticky top-20">
            {/* User Info */}
            <div className="text-center mb-4 pb-4 border-b border-border">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <User size={28} className="text-primary" />
              </div>
              <p className="font-bold text-foreground">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-muted-foreground">{user?.email || user?.phone}</p>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition ${
                      isActive
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={() => logout()}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition w-full"
              >
                <LogOut size={16} />
                تسجيل الخروج
              </button>
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="lg:col-span-3">{children}</main>
      </div>
    </div>
  );
}
