import Link from 'next/link';
import { Search } from 'lucide-react';
import { ProductService } from '@/lib/services/product.service';
import { serialize } from '@/lib/utils/serialize';
import ProductCard from '@/components/store/product-card';

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q, page: pageStr } = await searchParams;
  const page = pageStr ? Number(pageStr) : 1;

  if (!q || !q.trim()) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Search size={48} className="mx-auto text-muted-foreground/30 mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">البحث في المتجر</h1>
        <p className="text-muted-foreground text-sm">اكتب كلمة للبحث عن المنتجات</p>
      </div>
    );
  }

  const result = await ProductService.list({
    search: q.trim(),
    page,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  }).catch(() => ({ products: [], total: 0, page: 1, limit: 20 }));

  const totalPages = Math.ceil(result.total / result.limit);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          نتائج البحث: &ldquo;{q}&rdquo;
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{result.total} نتيجة</p>
      </div>

      {result.products.length === 0 ? (
        <div className="text-center py-16">
          <Search size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد نتائج</h3>
          <p className="text-muted-foreground text-sm mb-4">جرب كلمات بحث أخرى</p>
          <Link href="/products" className="text-primary text-sm hover:underline">تصفح جميع المنتجات</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {(serialize(result.products) as any[]).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Link
                href={`/search?q=${encodeURIComponent(q)}&page=${page - 1}`}
                className={`px-4 py-2 rounded-lg border border-border bg-card text-foreground text-sm hover:bg-muted transition ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
              >
                السابق
              </Link>
              <span className="text-sm text-muted-foreground px-3">{page} من {totalPages}</span>
              <Link
                href={`/search?q=${encodeURIComponent(q)}&page=${page + 1}`}
                className={`px-4 py-2 rounded-lg border border-border bg-card text-foreground text-sm hover:bg-muted transition ${page >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
              >
                التالي
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
