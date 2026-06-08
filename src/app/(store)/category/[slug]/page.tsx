import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { CategoryService } from '@/lib/services/category.service';
import { ProductService } from '@/lib/services/product.service';
import { serialize } from '@/lib/utils/serialize';
import ProductCard from '@/components/store/product-card';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageStr } = await searchParams;
  const page = pageStr ? Number(pageStr) : 1;

  let category;
  try {
    category = await CategoryService.getBySlug(slug);
  } catch {
    notFound();
  }

  const result = await ProductService.list({
    category: slug,
    page,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  }).catch(() => ({ products: [], total: 0, page: 1, limit: 20 }));

  const totalPages = Math.ceil(result.total / result.limit);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition">الرئيسية</Link>
        <ChevronLeft size={14} />
        <Link href="/products" className="hover:text-primary transition">المنتجات</Link>
        <ChevronLeft size={14} />
        <span className="text-foreground font-medium">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{category.name}</h1>
        {category.description && (
          <p className="text-muted-foreground mt-2 text-sm">{category.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-1">{result.total} منتج</p>
      </div>

      {/* Subcategories */}
      {category.children && category.children.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {category.children.map((child: any) => (
            <Link
              key={child.id}
              href={`/category/${child.slug}`}
              className="px-4 py-2 rounded-xl bg-card border border-border text-sm text-foreground hover:border-primary hover:text-primary transition"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      {/* Products */}
      {result.products.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4 opacity-30">📦</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد منتجات في هذا التصنيف</h3>
          <Link href="/products" className="text-primary text-sm hover:underline">تصفح جميع المنتجات</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {(serialize(result.products) as any[]).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Link
                href={`/category/${slug}?page=${page - 1}`}
                className={`px-4 py-2 rounded-lg border border-border bg-card text-foreground text-sm hover:bg-muted transition ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
              >
                السابق
              </Link>
              <span className="text-sm text-muted-foreground px-3">{page} من {totalPages}</span>
              <Link
                href={`/category/${slug}?page=${page + 1}`}
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
