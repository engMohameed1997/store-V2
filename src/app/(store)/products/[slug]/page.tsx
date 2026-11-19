import { notFound } from 'next/navigation';
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

  try {
    const product = await ProductService.getBySlug(slug);
    return <ProductDetailClient product={serialize(product) as any} />;
  } catch {
    notFound();
  }
}
