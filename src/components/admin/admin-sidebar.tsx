'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  Tag,
  Ticket,
  Image,
  Star,
  Shield,
  Truck,
  Settings,
  BarChart3,
  FileText,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Store,
  FolderOpen,
  MapPin,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/mx-panel', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/mx-panel/products', label: 'المنتجات', icon: Package },
  { href: '/mx-panel/orders', label: 'الطلبات', icon: ShoppingCart },
  { href: '/mx-panel/users', label: 'المستخدمين', icon: Users },
  { href: '/mx-panel/categories', label: 'الأصناف', icon: FolderTree },
  { href: '/mx-panel/brands', label: 'البراندات', icon: Tag },
  { href: '/mx-panel/coupons', label: 'الكوبونات', icon: Ticket },
  { href: '/mx-panel/banners', label: 'البانرات', icon: Image },
  { href: '/mx-panel/media', label: 'مكتبة الوسائط', icon: FolderOpen },
  { href: '/mx-panel/branches', label: 'الفروع والمخازن', icon: MapPin },
  { href: '/mx-panel/tickets', label: 'تذاكر الدعم', icon: MessageSquare },
  { href: '/mx-panel/reviews', label: 'المراجعات', icon: Star },
  { href: '/mx-panel/warranties', label: 'الضمانات', icon: Shield },
  { href: '/mx-panel/shipping', label: 'التوصيل', icon: Truck },
  { href: '/mx-panel/invoices', label: 'الفواتير', icon: FileText },
  { href: '/mx-panel/reports', label: 'التقارير', icon: BarChart3 },
  { href: '/mx-panel/settings', label: 'الإعدادات', icon: Settings },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string) => {
    if (href === '/mx-panel') return pathname === '/mx-panel';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'fixed top-0 right-0 h-screen bg-card border-l border-border flex flex-col transition-all duration-300 z-40',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-border shrink-0">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Store size={20} className="text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="font-bold text-foreground text-lg truncate">لوحة التحكم</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon size={20} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3 space-y-2 shrink-0">
        {/* User info */}
        {!collapsed && user && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
            {user.firstName} {user.lastName}
            <br />
            <span className="text-[10px] opacity-70">{user.role}</span>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={() => logout()}
          title={collapsed ? 'تسجيل الخروج' : undefined}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition"
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span>تسجيل الخروج</span>}
        </button>

        {/* Toggle */}
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full py-2 rounded-xl text-muted-foreground hover:bg-muted transition"
        >
          {collapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>
    </aside>
  );
}
