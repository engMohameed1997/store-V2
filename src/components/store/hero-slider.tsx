'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Banner } from '@/lib/types/store';

interface Props {
  banners: Banner[];
}

export default function HeroSlider({ banners }: Props) {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent(index);
    setTimeout(() => setIsTransitioning(false), 700);
  }, [isTransitioning]);

  const next = useCallback(() => {
    goTo((current + 1) % banners.length);
  }, [current, banners.length, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + banners.length) % banners.length);
  }, [current, banners.length, goTo]);

  // Auto-slide
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [banners.length, next]);

  if (banners.length === 0) {
    // Fallback hero when no banners
    return (
      <section className="relative overflow-hidden rounded-2xl mx-4 mt-4 h-[220px] sm:h-[320px] md:h-[400px]">
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark, #132B45) 100%)' }}
        >
          <div className="text-center text-white px-6">
            <h2 className="text-3xl md:text-5xl font-black mb-3">مرحباً بك في متجرنا</h2>
            <p className="text-lg md:text-xl text-white/80 mb-6">اكتشف أفضل المنتجات بأفضل الأسعار</p>
            <Link
              href="/products"
              className="inline-block bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white px-8 py-3 rounded-xl font-bold transition-all duration-300 hover:shadow-lg hover:shadow-[var(--accent)]/25 hover:-translate-y-0.5"
            >
              تسوق الآن
            </Link>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-2xl mx-4 mt-4 h-[220px] sm:h-[320px] md:h-[400px] group">
      {banners.map((banner, i) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            i === current ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
        >
          {banner.link ? (
            <Link href={banner.link} className="block w-full h-full">
              <BannerContent banner={banner} />
            </Link>
          ) : (
            <BannerContent banner={banner} />
          )}
        </div>
      ))}

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              title={`الانتقال إلى ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? 'w-8 bg-[var(--accent)]' : 'w-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}

      {/* Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            title="السابق"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/40 transition-all duration-300 z-10 opacity-0 group-hover:opacity-100 hover:scale-110"
          >
            <ChevronRight size={20} />
          </button>
          <button
            onClick={next}
            title="التالي"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/40 transition-all duration-300 z-10 opacity-0 group-hover:opacity-100 hover:scale-110"
          >
            <ChevronLeft size={20} />
          </button>
        </>
      )}
    </section>
  );
}

function BannerContent({ banner }: { banner: Banner }) {
  return (
    <div
      className="w-full h-full flex items-center justify-center relative"
      style={{
        background: `linear-gradient(135deg, var(--primary) 0%, var(--primary-dark, #132B45) 100%)`,
      }}
    >
      {/* Background image if exists */}
      {banner.image && (
        <img
          src={banner.image}
          alt={banner.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      {/* Text content */}
      <div className="relative z-10 text-center text-white px-6">
        <h2 className="text-2xl md:text-4xl font-black mb-2 drop-shadow-lg">{banner.titleAr || banner.title}</h2>
        <span className="inline-block bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white px-6 py-2.5 rounded-xl font-medium transition-all duration-300 mt-4">
          تسوق الآن
        </span>
      </div>
      {/* Decorative */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
    </div>
  );
}
