'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { CategoryWithChildren } from '@/lib/types/store';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success) setCategories(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">التصنيفات</h1>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {categories.map(cat => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary hover:shadow-lg transition-all"
            >
              {cat.image ? (
                <img
                  src={cat.image}
                  alt={cat.nameAr || cat.name}
                  className="w-16 h-16 rounded-xl object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <span className={`w-16 h-16 rounded-xl bg-primary/5 flex items-center justify-center text-2xl ${cat.image ? 'hidden' : ''}`}>
                📁
              </span>
              <span className="text-sm font-medium text-center text-foreground group-hover:text-primary transition">
                {cat.nameAr || cat.name}
              </span>
              {cat.children.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {cat.children.length} تصنيف فرعي
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
