'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4 select-none">⚠️</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">حدث خطأ</h1>
        <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
          عذراً، حدث خطأ غير متوقع أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-primary-foreground rounded-xl font-bold transition-all hover:shadow-lg text-sm"
          >
            <RefreshCw size={16} />
            إعادة المحاولة
          </button>
          <Link href="/" className="flex items-center gap-2 px-5 py-2.5 bg-card border border-border hover:border-primary text-foreground rounded-xl font-medium transition text-sm">
            <Home size={16} />
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
