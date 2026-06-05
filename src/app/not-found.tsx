import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <h1 className="text-7xl font-bold tracking-tighter text-foreground">
          404
        </h1>
        <p className="text-lg text-muted-foreground">
          الصفحة التي تبحث عنها غير موجودة
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/80"
      >
        العودة للرئيسية
      </Link>
    </div>
  );
}
