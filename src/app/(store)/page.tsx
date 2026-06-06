import HeroSlider from '@/components/store/hero-slider';
import CategoryGrid from '@/components/store/category-grid';
import ProductSection from '@/components/store/product-section';
import FeaturesStrip from '@/components/store/features-strip';
import PromotionalBanner from '@/components/store/promotional-banner';
import { ProductService } from '@/lib/services/product.service';
import { CategoryService } from '@/lib/services/category.service';
import { BannerService } from '@/lib/services/banner.service';

export default async function HomePage() {
  const [featuredResult, newResult, bestSellingResult, categories, banners] = await Promise.all([
    ProductService.list({ featured: true, limit: 12, page: 1 }).catch(() => ({ products: [], total: 0, page: 1, limit: 12 })),
    ProductService.list({ sortBy: 'createdAt', sortOrder: 'desc', limit: 12, page: 1 }).catch(() => ({ products: [], total: 0, page: 1, limit: 12 })),
    ProductService.list({ sortBy: 'soldCount', sortOrder: 'desc', limit: 12, page: 1 }).catch(() => ({ products: [], total: 0, page: 1, limit: 12 })),
    CategoryService.list().catch(() => []),
    BannerService.listActive().catch(() => []),
  ]);

  return (
    <div className="pb-12">
      {/* Hero Slider */}
      <HeroSlider banners={banners as any} />

      {/* Category Icons */}
      <CategoryGrid categories={categories as any} />

      {/* Features Strip */}
      <FeaturesStrip />

      {/* Featured Products */}
      <ProductSection
        title="المنتجات المميزة"
        products={featuredResult.products as any}
        viewAllLink="/products?featured=true"
      />

      {/* Promo Banner */}
      <PromotionalBanner />

      {/* Best Selling */}
      <ProductSection
        title="الأكثر مبيعاً"
        products={bestSellingResult.products as any}
        viewAllLink="/products?sortBy=soldCount&sortOrder=desc"
      />

      {/* New Products */}
      {newResult.products.length > 0 && (
        <ProductSection
          title="وصل حديثاً"
          products={newResult.products as any}
          viewAllLink="/products?sortBy=createdAt&sortOrder=desc"
        />
      )}
    </div>
  );
}
