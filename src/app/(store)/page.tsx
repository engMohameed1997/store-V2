import HeroSlider from '@/components/store/hero-slider';
import CategoryGrid from '@/components/store/category-grid';
import ProductSection from '@/components/store/product-section';
import FeaturesStrip from '@/components/store/features-strip';
import PromotionalBanner from '@/components/store/promotional-banner';
import { ProductService } from '@/lib/services/product.service';
import { CategoryService } from '@/lib/services/category.service';
import { BannerService } from '@/lib/services/banner.service';
import { serialize } from '@/lib/utils/serialize';

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
      <HeroSlider banners={serialize(banners) as any} />

      {/* Category Icons */}
      <CategoryGrid categories={serialize(categories) as any} />

      {/* Features Strip */}
      <FeaturesStrip />

      {/* Featured Products */}
      <ProductSection
        title="المنتجات المميزة"
        products={serialize(featuredResult.products) as any}
        viewAllLink="/products?featured=true"
      />

      {/* Promo Banner */}
      <PromotionalBanner />

      {/* Best Selling */}
      <ProductSection
        title="الأكثر مبيعاً"
        products={serialize(bestSellingResult.products) as any}
        viewAllLink="/products?sortBy=soldCount&sortOrder=desc"
      />

      {/* New Products */}
      {newResult.products.length > 0 && (
        <ProductSection
          title="وصل حديثاً"
          products={serialize(newResult.products) as any}
          viewAllLink="/products?sortBy=createdAt&sortOrder=desc"
        />
      )}
    </div>
  );
}
