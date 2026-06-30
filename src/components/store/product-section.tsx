'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import ProductCard from './product-card';
import type { ProductListItem } from '@/lib/types/store';

interface Props {
  title: string;
  products: ProductListItem[];
  viewAllLink?: string;
}

export default function ProductSection({ title, products, viewAllLink }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' });
  };

  if (!products.length) return null;

  return (
    <section className="mt-10 px-4">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">{title}</h2>
        {viewAllLink && (
          <Link
            href={viewAllLink}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition font-medium group"
          >
            عرض المزيد
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
        )}
      </div>

      {/* Products Carousel */}
      <div className="relative">
        <button
          onClick={() => scroll('right')}
          className="scroll-btn absolute -right-2 top-1/2 -translate-y-1/2 z-10"
          title="التمرير يميناً"
        >
          <ChevronRight size={18} />
        </button>
        <button
          onClick={() => scroll('left')}
          className="scroll-btn absolute -left-2 top-1/2 -translate-y-1/2 z-10"
          title="التمرير يساراً"
        >
          <ChevronLeft size={18} />
        </button>

        <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-1">
          {products.map(product => (
            <div key={product.id} className="flex-shrink-0 w-[180px] md:w-[220px] h-[380px] md:h-[420px]">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
