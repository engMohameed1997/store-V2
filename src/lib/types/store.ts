// ============================================
// Store Frontend Types
// ============================================

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  position: number;
  isPrimary: boolean;
}

export interface CategoryBasic {
  id: string;
  name: string;
  slug: string;
}

export interface BrandBasic {
  id: string;
  name: string;
  slug: string;
}

export interface ProductListItem {
  id: string;
  slug: string;
  name: string;
  nameAr: string | null;
  price: number | string;
  compareAtPrice: number | string | null;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  avgRating: number | string;
  reviewCount: number;
  soldCount: number;
  createdAt: string;
  images: ProductImage[];
  category: CategoryBasic | null;
  brand: BrandBasic | null;
}

export interface CategoryWithChildren {
  id: string;
  slug: string;
  name: string;
  nameAr: string | null;
  description: string | null;
  image: string | null;
  parentId: string | null;
  position: number;
  isActive: boolean;
  children: CategoryWithChildren[];
  _count: { products: number };
}

export interface Banner {
  id: string;
  title: string;
  titleAr: string | null;
  image: string;
  mobileImage: string | null;
  link: string | null;
  placement: string;
  position: number;
  isActive: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
