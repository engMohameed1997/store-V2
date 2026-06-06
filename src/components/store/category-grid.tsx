'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CategoryWithChildren } from '@/lib/types/store';

interface Props {
  categories: CategoryWithChildren[];
}

export default function CategoryGrid({ categories }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  if (categories.length === 0) return null;

  return (
    <section className="mt-6 px-4">
      <div className="relative">
        {/* Scroll buttons - Desktop only */}
        <button
          onClick={() => scroll('right')}
          className="scroll-btn absolute right-0 top-1/2 -translate-y-1/2 z-10"
          title="التمرير يميناً"
        >
          <ChevronRight size={18} />
        </button>
        <button
          onClick={() => scroll('left')}
          className="scroll-btn absolute left-0 top-1/2 -translate-y-1/2 z-10"
          title="التمرير يساراً"
        >
          <ChevronLeft size={18} />
        </button>

        <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide py-3 px-2">
          {categories.map((cat, index) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="flex-shrink-0 flex flex-col items-center gap-2.5 group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 border border-border flex items-center justify-center text-3xl md:text-4xl group-hover:shadow-xl group-hover:border-primary/30 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300">
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-12 h-12 object-contain" />
                ) : (
                  <span className="opacity-70 group-hover:opacity-100 transition">📁</span>
                )}
              </div>
              <span className="text-xs md:text-sm text-foreground text-center max-w-[90px] line-clamp-1 group-hover:text-primary font-medium transition">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
