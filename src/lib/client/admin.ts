import {
  getJson,
  postJson,
  putJson,
  deleteJson,
  type ApiResult,
} from "@/lib/client/api";
import type { ApiPaginatedResponse } from "@/lib/api/response";

const ADMIN_BASE = "/api/v1/mx-panel";

// ─── Shared Types ───────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  pagination: ApiPaginatedResponse["pagination"];
}

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  isActive?: boolean;
  branchId?: string;
  stockStatus?: "all" | "in_stock" | "out_of_stock";
}

// ─── Product Types ──────────────────────────────────────────────

export interface AdminProduct {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  isActive: boolean;
  categoryId?: string;
  brandId?: string;
  images: string[];
  warrantyDuration?: number;
  warrantyUnit?: string;
  warrantyCoverage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImageInput {
  url: string;
  alt?: string;
  position: number;
  isPrimary: boolean;
}

export interface ProductSpecInput {
  key: string;
  value: string;
  position: number;
}

export interface CreateProductInput {
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  stock: number;
  lowStockThreshold?: number;
  weight?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  isDigital?: boolean;
  warrantyDuration?: number;
  warrantyUnit?: string;
  warrantyCoverage?: string;
  categoryId?: string;
  brandId?: string;
  metaTitle?: string;
  metaDescription?: string;
  images?: ProductImageInput[];
  specs?: ProductSpecInput[];
}

export type UpdateProductInput = Partial<CreateProductInput>;

// ─── Order Types ────────────────────────────────────────────────

export interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number | string;
  subtotal: number | string;
  shippingCost: number | string;
  discountAmount: number | string;
  userId: string;
  user?: { id: string; firstName: string; lastName: string; email?: string; phone?: string };
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    phone?: string;
  };
  items?: AdminOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number | string;
  totalPrice: number | string;
}

export interface UpdateOrderStatusInput {
  status: string;
  note?: string;
}

// ─── User Types ─────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUpdateUserInput {
  role?: string;
  status?: string;
  firstName?: string;
  lastName?: string;
}

// ─── Category Types ─────────────────────────────────────────────

export interface AdminCategory {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  image?: string;
  parentId?: string;
  isActive: boolean;
  position: number;
  children?: AdminCategory[];
  createdAt: string;
}

export interface CreateCategoryInput {
  name: string;
  nameAr?: string;
  slug: string;
  image?: string;
  parentId?: string;
  isActive?: boolean;
  position?: number;
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

// ─── Brand Types ────────────────────────────────────────────────

export interface AdminBrand {
  id: string;
  name: string;
  nameAr?: string;
  logo?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateBrandInput {
  name: string;
  nameAr?: string;
  logo?: string;
  description?: string;
  isActive?: boolean;
}

export type UpdateBrandInput = Partial<CreateBrandInput>;

// ─── Branch Types ───────────────────────────────────────────────

export interface AdminBranch {
  id: string;
  name: string;
  nameAr?: string | null;
  address: string;
  addressAr?: string | null;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

// ─── Coupon Types ───────────────────────────────────────────────

export interface AdminCoupon {
  id: string;
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  discountValue: number;
  scope: 'ALL' | 'SPECIFIC_PRODUCTS' | 'SPECIFIC_CATEGORIES';
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perUserLimit: number;
  usageCount: number;
  isActive: boolean;
  startsAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface CreateCouponInput {
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  discountValue: number;
  scope?: 'ALL' | 'SPECIFIC_PRODUCTS' | 'SPECIFIC_CATEGORIES';
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  isActive?: boolean;
  startsAt?: string;
  expiresAt?: string;
  productIds?: string[];
  categoryIds?: string[];
}

export type UpdateCouponInput = Partial<CreateCouponInput>;

// ─── Banner Types ───────────────────────────────────────────────

export interface AdminBanner {
  id: string;
  image: string;
  mobileImage?: string;
  videoUrl?: string;
  position: number;
  isActive: boolean;
  startsAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface CreateBannerInput {
  image: string;
  mobileImage?: string;
  videoUrl?: string;
  position?: number;
  isActive?: boolean;
  startsAt?: string;
  expiresAt?: string;
}

export type UpdateBannerInput = Partial<CreateBannerInput>;

// ─── Review Types ───────────────────────────────────────────────

export interface AdminReview {
  id: string;
  title?: string;
  comment?: string;
  rating: number;
  isApproved: boolean;
  adminReply?: string;
  userId: string;
  productId: string;
  user?: { id: string; firstName: string; lastName: string };
  product?: { id: string; name: string; slug: string };
  createdAt: string;
}

// ─── Warranty Types ─────────────────────────────────────────────

export interface AdminWarranty {
  id: string;
  orderItemId: string;
  productName: string;
  duration: number;
  unit: string;
  coverage?: string;
  startDate: string;
  endDate: string;
  serialNumber?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  orderItem?: {
    id: string;
    orderId: string;
    order?: {
      orderNumber: string;
      createdAt: string;
      user?: {
        id: string;
        firstName: string;
        lastName: string;
        phone?: string;
      };
    };
  };
}

export interface UpdateWarrantyInput {
  serialNumber?: string;
  status?: string;
  coverage?: string;
}

// ─── Helper: build query string ─────────────────────────────────

function buildQuery(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );
  if (entries.length === 0) return "";
  const qs = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");
  return `?${qs}`;
}

// ─── Admin API Client ───────────────────────────────────────────

export function createAdminClient() {
  const opts = {};

  return {
    // ── Products ──────────────────────────────────────────────
    products: {
      list(params?: ListParams & { category?: string; brand?: string }) {
        const qs = buildQuery({ ...params });
        return getJson<AdminProduct[]>(`${ADMIN_BASE}/products${qs}`, opts) as Promise<ApiResult<AdminProduct[]>>;
      },
      get(id: string) {
        return getJson<AdminProduct>(`${ADMIN_BASE}/products/${encodeURIComponent(id)}`, opts);
      },
      create(input: CreateProductInput) {
        return postJson<AdminProduct>(`${ADMIN_BASE}/products`, input, opts);
      },
      update(id: string, input: UpdateProductInput) {
        return putJson<AdminProduct>(`${ADMIN_BASE}/products/${encodeURIComponent(id)}`, input, opts);
      },
      delete(id: string) {
        return deleteJson(`${ADMIN_BASE}/products/${encodeURIComponent(id)}`, opts);
      },
    },

    // ── Orders ────────────────────────────────────────────────
    orders: {
      list(params?: ListParams & { status?: string }) {
        const qs = buildQuery({ ...params });
        return getJson<AdminOrder[]>(`${ADMIN_BASE}/orders${qs}`, opts) as Promise<ApiResult<AdminOrder[]>>;
      },
      get(id: string) {
        return getJson<AdminOrder>(`${ADMIN_BASE}/orders/${encodeURIComponent(id)}`, opts);
      },
      updateStatus(id: string, input: UpdateOrderStatusInput) {
        return putJson<AdminOrder>(`${ADMIN_BASE}/orders/${encodeURIComponent(id)}`, input, opts);
      },
      confirmPayment(id: string, transactionId?: string) {
        return postJson<AdminOrder>(`${ADMIN_BASE}/orders/${encodeURIComponent(id)}`, { transactionId }, opts);
      },
    },

    // ── Users ─────────────────────────────────────────────────
    users: {
      list(params?: ListParams & { role?: string; status?: string }) {
        const qs = buildQuery({ ...params });
        return getJson<AdminUser[]>(`${ADMIN_BASE}/users${qs}`, opts) as Promise<ApiResult<AdminUser[]>>;
      },
      get(id: string) {
        return getJson<AdminUser>(`${ADMIN_BASE}/users/${encodeURIComponent(id)}`, opts);
      },
      update(id: string, input: AdminUpdateUserInput) {
        return putJson<AdminUser>(`${ADMIN_BASE}/users/${encodeURIComponent(id)}`, input, opts);
      },
      delete(id: string) {
        return deleteJson(`${ADMIN_BASE}/users/${encodeURIComponent(id)}`, opts);
      },
    },

    // ── Categories ────────────────────────────────────────────
    categories: {
      list() {
        return getJson<AdminCategory[]>(`${ADMIN_BASE}/categories`, opts);
      },
      get(id: string) {
        return getJson<AdminCategory>(`${ADMIN_BASE}/categories/${encodeURIComponent(id)}`, opts);
      },
      create(input: CreateCategoryInput) {
        return postJson<AdminCategory>(`${ADMIN_BASE}/categories`, input, opts);
      },
      update(id: string, input: UpdateCategoryInput) {
        return putJson<AdminCategory>(`${ADMIN_BASE}/categories/${encodeURIComponent(id)}`, input, opts);
      },
      delete(id: string) {
        return deleteJson(`${ADMIN_BASE}/categories/${encodeURIComponent(id)}`, opts);
      },
    },

    // ── Brands ────────────────────────────────────────────────
    brands: {
      list() {
        return getJson<AdminBrand[]>(`${ADMIN_BASE}/brands`, opts);
      },
      create(input: CreateBrandInput) {
        return postJson<AdminBrand>(`${ADMIN_BASE}/brands`, input, opts);
      },
      update(id: string, input: UpdateBrandInput) {
        return putJson<AdminBrand>(`${ADMIN_BASE}/brands/${encodeURIComponent(id)}`, input, opts);
      },
      delete(id: string) {
        return deleteJson(`${ADMIN_BASE}/brands/${encodeURIComponent(id)}`, opts);
      },
    },

    // ── Coupons ───────────────────────────────────────────────
    coupons: {
      list(params?: ListParams) {
        const qs = buildQuery({ ...params });
        return getJson<AdminCoupon[]>(`${ADMIN_BASE}/coupons${qs}`, opts) as Promise<ApiResult<AdminCoupon[]>>;
      },
      get(id: string) {
        return getJson<AdminCoupon>(`${ADMIN_BASE}/coupons/${encodeURIComponent(id)}`, opts);
      },
      create(input: CreateCouponInput) {
        return postJson<AdminCoupon>(`${ADMIN_BASE}/coupons`, input, opts);
      },
      update(id: string, input: UpdateCouponInput) {
        return putJson<AdminCoupon>(`${ADMIN_BASE}/coupons/${encodeURIComponent(id)}`, input, opts);
      },
      delete(id: string) {
        return deleteJson(`${ADMIN_BASE}/coupons/${encodeURIComponent(id)}`, opts);
      },
    },

    // ── Banners ───────────────────────────────────────────────
    banners: {
      list() {
        return getJson<AdminBanner[]>(`${ADMIN_BASE}/banners`, opts);
      },
      create(input: CreateBannerInput) {
        return postJson<AdminBanner>(`${ADMIN_BASE}/banners`, input, opts);
      },
      update(id: string, input: UpdateBannerInput) {
        return putJson<AdminBanner>(`${ADMIN_BASE}/banners/${encodeURIComponent(id)}`, input, opts);
      },
      delete(id: string) {
        return deleteJson(`${ADMIN_BASE}/banners/${encodeURIComponent(id)}`, opts);
      },
    },

    // ── Reviews ───────────────────────────────────────────────
    reviews: {
      list(params?: ListParams) {
        const qs = buildQuery({ ...params });
        return getJson<AdminReview[]>(`${ADMIN_BASE}/reviews${qs}`, opts) as Promise<ApiResult<AdminReview[]>>;
      },
      approve(id: string) {
        return putJson<AdminReview>(`${ADMIN_BASE}/reviews/${encodeURIComponent(id)}`, undefined, opts);
      },
      reply(id: string, reply: string) {
        return postJson<AdminReview>(`${ADMIN_BASE}/reviews/${encodeURIComponent(id)}`, { reply }, opts);
      },
      delete(id: string) {
        return deleteJson(`${ADMIN_BASE}/reviews/${encodeURIComponent(id)}`, opts);
      },
    },

    // ── Warranties ────────────────────────────────────────────
    warranties: {
      list(params?: ListParams & { status?: string }) {
        const qs = buildQuery({ ...params });
        return getJson<AdminWarranty[]>(`${ADMIN_BASE}/warranties${qs}`, opts) as Promise<ApiResult<AdminWarranty[]>>;
      },
      get(id: string) {
        return getJson<AdminWarranty>(`${ADMIN_BASE}/warranties/${encodeURIComponent(id)}`, opts);
      },
      update(id: string, input: UpdateWarrantyInput) {
        return putJson<AdminWarranty>(`${ADMIN_BASE}/warranties/${encodeURIComponent(id)}`, input, opts);
      },
    },

    // ── Analytics ─────────────────────────────────────────────
    analytics: {
      getDashboard() {
        return getJson<unknown>(`${ADMIN_BASE}/analytics`, opts);
      },
      getReports() {
        return getJson<unknown>(`${ADMIN_BASE}/analytics/reports`, opts);
      },
    },

    // ── Branches ──────────────────────────────────────────────
    branches: {
      list() {
        return getJson<AdminBranch[]>(`${ADMIN_BASE}/branches`, opts);
      },
    },
  };
}
