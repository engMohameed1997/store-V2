'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Filter, SlidersHorizontal, Grid3X3, List } from 'lucide-react';
import ProductCard from '@/components/store/product-card';
import type { ProductListItem, CategoryWithChildren } from '@/lib/types/store';

interface Props {
  products: ProductListItem[];
  total: number;
  page: number;
  limit: number;
  categories: CategoryWithChildren[];
  currentFilters: Record<string, unknown>;
}

export default function ProductsPageClient({ products, total, page, limit, categories, currentFilters }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const totalPages = Math.ceil(total / limit);

  const updateFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`/products?${params.toString()}`);
  };

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', p.toString());
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">المنتجات</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} منتج</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Sort */}
          <select
            value={`${currentFilters.sortBy || 'createdAt'}-${currentFilters.sortOrder || 'desc'}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              const params = new URLSearchParams(searchParams.toString());
              params.set('sortBy', sortBy);
              params.set('sortOrder', sortOrder);
              router.push(`/products?${params.toString()}`);
            }}
            className="h-9 px-3 rounded-lg border border-border bg-card text-foreground text-sm outline-none focus:border-primary transition"
          >
            <option value="createdAt-desc">الأحدث</option>
            <option value="price-asc">السعر: من الأقل</option>
            <option value="price-desc">السعر: من الأعلى</option>
            <option value="soldCount-desc">الأكثر مبيعاً</option>
            <option value="avgRating-desc">الأعلى تقييماً</option>
          </select>

          {/* Filter Toggle - Mobile */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden h-9 px-3 rounded-lg border border-border bg-card text-foreground flex items-center gap-1.5 text-sm"
          >
            <Filter size={16} />
            فلتر
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        <aside className={`${showFilters ? 'fixed inset-0 z-50 bg-black/50 md:relative md:bg-transparent' : 'hidden'} md:block w-64 flex-shrink-0`}>
          <div className={`${showFilters ? 'absolute right-0 top-0 h-full w-72 bg-card p-4 overflow-y-auto md:relative md:w-auto md:p-0' : ''}`}>
            {showFilters && (
              <div className="flex items-center justify-between mb-4 md:hidden">
                <h3 className="font-bold text-foreground">الفلاتر</h3>
                <button onClick={() => setShowFilters(false)} className="text-muted-foreground">✕</button>
              </div>
            )}

            <div className="space-y-4">
              {/* Categories Filter */}
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="font-semibold text-foreground mb-3 text-sm flex items-center gap-2">
                  <SlidersHorizontal size={14} />
                  التصنيفات
                </h3>
                <div className="space-y-1.5">
                  <button
                    onClick={() => updateFilter('category', undefined)}
                    className={`block w-full text-right px-3 py-2 rounded-lg text-sm transition ${!currentFilters.category ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'}`}
                  >
                    الكل
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => updateFilter('category', cat.slug)}
                      className={`block w-full text-right px-3 py-2 rounded-lg text-sm transition ${currentFilters.category === cat.slug ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* In Stock Filter */}
              <div className="bg-card rounded-xl border border-border p-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentFilters.inStock === true}
                    onChange={(e) => updateFilter('inStock', e.target.checked ? 'true' : undefined)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground">متوفر فقط</span>
                </label>
              </div>
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          {products.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4 opacity-30">📦</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد منتجات</h3>
              <p className="text-muted-foreground text-sm">جرب تغيير الفلاتر أو البحث بكلمات أخرى</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                    className="px-4 py-2 rounded-lg border border-border bg-card text-foreground text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition"
                  >
                    السابق
                  </button>
                  <span className="text-sm text-muted-foreground px-3">
                    {page} من {totalPages}
                  </span>
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages}
                    className="px-4 py-2 rounded-lg border border-border bg-card text-foreground text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition"
                  >
                    التالي
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
