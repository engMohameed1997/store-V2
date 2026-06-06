import { ProductService } from '@/lib/services/product.service';
import { CategoryService } from '@/lib/services/category.service';
import ProductsPageClient from './products-client';

interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;

  const filters = {
    search: params.search,
    category: params.category,
    brand: params.brand,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    inStock: params.inStock === 'true' ? true : undefined,
    featured: params.featured === 'true' ? true : undefined,
    sortBy: params.sortBy as 'price' | 'createdAt' | 'soldCount' | 'avgRating' | 'name' | undefined,
    sortOrder: (params.sortOrder as 'asc' | 'desc') || 'desc',
    page: params.page ? Number(params.page) : 1,
    limit: 20,
  };

  const [result, categories] = await Promise.all([
    ProductService.list(filters).catch(() => ({ products: [], total: 0, page: 1, limit: 20 })),
    CategoryService.list().catch(() => []),
  ]);

  return (
    <ProductsPageClient
      products={result.products as any}
      total={result.total}
      page={result.page}
      limit={result.limit}
      categories={categories as any}
      currentFilters={filters}
    />
  );
}
