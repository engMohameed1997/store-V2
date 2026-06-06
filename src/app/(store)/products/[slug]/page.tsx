import { notFound } from 'next/navigation';
import { ProductService } from '@/lib/services/product.service';
import ProductDetailClient from './product-detail-client';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;

  try {
    const product = await ProductService.getBySlug(slug);
    return <ProductDetailClient product={product as any} />;
  } catch {
    notFound();
  }
}
