'use client';

import { Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/components/providers/auth-provider';

interface AdminHeaderProps {
  onMenuToggle: () => void;
  title?: string;
}

export function AdminHeader({ onMenuToggle, title }: AdminHeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-muted-foreground hover:bg-muted transition"
        >
          <Menu size={20} />
        </button>
        {title && (
          <h1 className="text-lg font-bold text-foreground">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2.5 rounded-xl text-muted-foreground hover:bg-muted transition"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User badge */}
        {user && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-muted rounded-xl">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {user.firstName?.[0]}
            </div>
            <span className="text-sm text-foreground font-medium">
              {user.firstName}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
