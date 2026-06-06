import Link from 'next/link';

export default function PromotionalBanner() {
  return (
    <section className="mt-10 px-4">
      <div className="promo-banner flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="relative z-10">
          <span className="inline-block bg-[var(--accent)]/20 text-[var(--accent)] px-3 py-1 rounded-full text-sm font-medium mb-3 backdrop-blur-sm">
            عروض حصرية
          </span>
          <h2 className="text-2xl md:text-3xl font-black mb-2">خصومات تصل إلى 40%</h2>
          <p className="text-white/70 mb-5 text-sm md:text-base">اكتشف أحدث العروض والتخفيضات على مختلف الفئات</p>
          <Link
            href="/products?featured=true"
            className="inline-block bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white px-6 py-2.5 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-[var(--accent)]/25 hover:-translate-y-0.5"
          >
            تسوق الآن
          </Link>
        </div>
        <div className="text-8xl md:text-9xl opacity-20 select-none">🛍️</div>
      </div>
    </section>
  );
}
