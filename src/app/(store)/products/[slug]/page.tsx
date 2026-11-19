import { notFound, permanentRedirect } from 'next/navigation';
import { ProductService } from '@/lib/services/product.service';
import { serialize } from '@/lib/utils/serialize';
import ProductDetailClient from './product-detail-client';

interface Props {
  params: Promise<{ slug: string }>;
}

/** Arabic slugs arrive percent-encoded in params. */
function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const slug = decodeSlug((await params).slug);

  let product;
  try {
    product = await ProductService.getBySlug(slug);
  } catch {
    // Old Arabic or pre-rename links: same product, new slug.
    const current = await ProductService.findSlugBySuffix(slug);
    if (current && current !== slug) permanentRedirect(`/products/${current}`);
    notFound();
  }
  return <ProductDetailClient product={serialize(product) as any} />;
}
