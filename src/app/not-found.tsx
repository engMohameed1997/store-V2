import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-primary/20 mb-2 select-none">404</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">الصفحة غير موجودة</h1>
        <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها. تأكد من صحة الرابط أو عُد إلى الصفحة الرئيسية.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/" className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-primary-foreground rounded-xl font-bold transition-all hover:shadow-lg text-sm">
            <Home size={16} />
            الصفحة الرئيسية
          </Link>
          <Link href="/search" className="flex items-center gap-2 px-5 py-2.5 bg-card border border-border hover:border-primary text-foreground rounded-xl font-medium transition text-sm">
            <Search size={16} />
            البحث
          </Link>
        </div>
      </div>
    </div>
  );
}
