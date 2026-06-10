'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, ShoppingCart, Heart, User, Menu, X, ChevronDown, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/components/providers/auth-provider';
import type { CategoryWithChildren } from '@/lib/types/store';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => setMounted(true), []);
  const megaRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fetch categories
  useEffect(() => {
    fetch('/api/v1/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success) setCategories(data.data);
      })
      .catch(() => {});
  }, []);

  // Scroll detection for header shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) setMegaMenuOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close mobile menu on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setMegaMenuOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  }, [searchQuery]);

  return (
    <header className={`sticky top-0 z-50 transition-shadow duration-300 ${scrolled ? 'shadow-lg shadow-black/5' : ''}`}>
      {/* Main Bar */}
      <div className="bg-primary text-white">
        <div className="container mx-auto px-4 flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 text-2xl font-black tracking-tight hover:opacity-90 transition">
            <span className="text-[var(--accent)]">الـ</span>خزاعي
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full group">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث عن منتجات، تصنيفات، أو علامات تجارية..."
                className="w-full h-10 pr-4 pl-12 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder:text-white/50 border border-white/20 focus:border-[var(--accent)] focus:bg-white/15 focus:ring-2 focus:ring-[var(--accent)]/20 outline-none transition-all duration-300"
              />
              <button
                type="submit"
                aria-label="بحث"
                className="absolute left-1.5 top-1/2 -translate-y-1/2 h-7 w-9 flex items-center justify-center bg-[var(--accent)] hover:bg-[var(--accent-dark)] rounded-lg transition-colors"
              >
                <Search size={16} />
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="header-icon-btn"
                title={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            )}

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="header-icon-btn"
                title="حسابي"
              >
                <User size={20} />
                <span className="hidden lg:inline text-xs">
                  {isAuthenticated ? user?.firstName : 'الحساب'}
                </span>
              </button>
              {userMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-card rounded-xl shadow-2xl border border-border py-2 z-50 animate-slide-down">
                  {isAuthenticated ? (
                    <>
                      <Link
                        href="/account"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-foreground hover:bg-primary/5 transition"
                      >
                        الملف الشخصي
                      </Link>
                      <Link
                        href="/account/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-foreground hover:bg-primary/5 transition"
                      >
                        طلباتي
                      </Link>
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); }}
                        className="block w-full text-right px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition"
                      >
                        تسجيل الخروج
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-foreground hover:bg-primary/5 transition"
                      >
                        تسجيل الدخول
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-foreground hover:bg-primary/5 transition"
                      >
                        إنشاء حساب
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Wishlist */}
            <Link href="/wishlist" className="header-icon-btn relative" title="المفضلة">
              <Heart size={20} />
            </Link>

            {/* Cart */}
            <Link href="/cart" className="header-icon-btn relative" title="سلة التسوق">
              <ShoppingCart size={20} />
            </Link>

            {/* Mobile Menu Toggle */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="header-icon-btn md:hidden" aria-label="القائمة">
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden px-4 pb-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ابحث عن منتجات..."
              className="w-full h-10 pr-4 pl-12 rounded-xl bg-white/10 text-white placeholder:text-white/50 border border-white/20 outline-none focus:border-[var(--accent)] transition"
            />
            <button type="submit" aria-label="بحث" className="absolute left-1.5 top-1/2 -translate-y-1/2 h-7 w-9 flex items-center justify-center bg-[var(--accent)] rounded-lg">
              <Search size={16} />
            </button>
          </div>
        </form>
      </div>

      {/* Navigation Bar - Desktop */}
      <nav className="bg-card border-b border-border hidden md:block">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 h-11 text-sm">
            {/* All Categories Dropdown */}
            <div className="relative" ref={megaRef}>
              <button
                onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-primary/5 font-semibold text-primary whitespace-nowrap transition"
              >
                <Menu size={16} />
                جميع الفئات
                <ChevronDown size={14} className={`transition-transform duration-200 ${megaMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {megaMenuOpen && (
                <div className="absolute top-full right-0 w-64 bg-card rounded-xl shadow-2xl border border-border py-2 z-50 animate-slide-down">
                  {categories.map(cat => (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.slug}`}
                      onClick={() => setMegaMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-primary/5 transition group"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-sm">
                          {cat.image ? '📁' : '📁'}
                        </span>
                        <span className="text-foreground group-hover:text-primary transition text-sm">{cat.name}</span>
                      </span>
                      {cat.children.length > 0 && (
                        <ChevronDown size={14} className="text-muted-foreground -rotate-90" />
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Category Links */}
            {categories.slice(0, 7).map(cat => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="px-3 py-2 rounded-lg hover:bg-primary/5 text-foreground hover:text-primary whitespace-nowrap transition text-sm"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute top-0 right-0 w-80 max-w-[85vw] h-full bg-card shadow-2xl animate-slide-right overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Mobile Menu Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-primary text-white">
              <span className="text-xl font-bold">القائمة</span>
              <button onClick={() => setMenuOpen(false)} aria-label="إغلاق" className="p-2 rounded-full hover:bg-white/10 transition">
                <X size={20} />
              </button>
            </div>

            {/* Categories */}
            <div className="p-2">
              <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">التصنيفات</p>
              {categories.map(cat => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/5 transition"
                >
                  <span className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center text-base">📁</span>
                  <span className="text-foreground text-sm">{cat.name}</span>
                </Link>
              ))}
            </div>

            {/* Mobile Menu Footer */}
            <div className="p-4 border-t border-border space-y-2 mt-auto">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="block w-full text-center py-2.5 bg-primary text-white rounded-xl font-medium transition hover:bg-primary/90"
              >
                تسجيل الدخول
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
