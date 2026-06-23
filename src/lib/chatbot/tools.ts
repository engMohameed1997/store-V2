import { tool, zodSchema } from "ai";
import { z } from "zod";
import type { AuthUser } from "@/lib/api/auth-guard";
import {
  getCachedProducts,
  getCachedProductById,
  getCachedUserOrders,
  getCachedOrderById,
  getCachedUserProfile,
} from "./cache";

const AUTH_REQUIRED = { requiresAuth: true, message: "يرجى تسجيل الدخول أولاً للوصول إلى هذه المعلومات." };

const SAFE_PRODUCT_FIELDS = [
  "id", "name", "nameAr", "slug", "price", "compareAtPrice",
  "stock", "avgRating", "reviewCount", "images", "category", "brand",
];

function safeProduct(p: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(p).filter(([k]) => SAFE_PRODUCT_FIELDS.includes(k))
  );
}

export function buildTools(authUser: AuthUser | null) {
  return {
    searchProducts: tool({
      description: "البحث عن منتجات في المتجر بالاسم أو الفئة",
      inputSchema: zodSchema(
        z.object({
          query: z.string().max(100).describe("كلمة البحث أو اسم المنتج"),
          category: z.string().max(50).optional().describe("اسم الفئة (اختياري)"),
        })
      ),
      execute: async ({ query, category }) => {
        const products = await getCachedProducts(query, category);
        if (!products.length) {
          return { found: false, message: "لم أجد منتجات تطابق بحثك." };
        }
        return {
          found: true,
          count: products.length,
          products: products.map((p) => safeProduct(p as unknown as Record<string, unknown>)),
        };
      },
    }),

    getProductDetails: tool({
      description: "جلب تفاصيل منتج محدد بواسطة ID أو slug",
      inputSchema: zodSchema(
        z.object({
          productId: z.string().max(50).describe("معرف المنتج أو الـ slug"),
        })
      ),
      execute: async ({ productId }) => {
        try {
          const product = await getCachedProductById(productId);
          return { found: true, product: safeProduct(product as unknown as Record<string, unknown>) };
        } catch {
          return { found: false, message: "المنتج غير موجود." };
        }
      },
    }),

    getPageInfo: tool({
      description: "الحصول على معلومات حول صفحات المتجر مثل FAQ والتوصيل والإرجاع",
      inputSchema: zodSchema(
        z.object({
          topic: z
            .enum(["delivery", "returns", "payment", "faq", "about"])
            .describe("الموضوع المطلوب"),
        })
      ),
      execute: async ({ topic }) => {
        const info: Record<string, string> = {
          delivery:
            "التوصيل داخل بغداد: 1-2 يوم عمل. المحافظات: 2-5 أيام عمل. مجاني للطلبات فوق 50,000 د.ع.",
          returns:
            "يمكن إرجاع المنتج خلال 14 يوماً من الاستلام بشرط أن يكون بحالته الأصلية مع العبوة. الاسترداد خلال 3-7 أيام عمل.",
          payment:
            "طرق الدفع المتاحة: الدفع عند الاستلام، زين كاش، كي كارد، فاست باي.",
          faq: "الأسئلة الشائعة: يمكنك تعديل الطلب خلال ساعة من تأكيده. الإلغاء متاح قبل الشحن. لإنشاء حساب اضغط 'إنشاء حساب'.",
          about: "متجر إلكتروني عراقي متخصص في توصيل المنتجات لجميع المحافظات الـ 18.",
        };
        return { topic, content: info[topic] };
      },
    }),

    getMyOrders: tool({
      description: "جلب قائمة طلبات المستخدم المسجل",
      inputSchema: zodSchema(
        z.object({
          page: z.number().int().min(1).max(10).optional().default(1),
        })
      ),
      execute: async ({ page }) => {
        if (!authUser) return AUTH_REQUIRED;
        const result = await getCachedUserOrders(authUser.userId, page ?? 1);
        return {
          total: result.total,
          page: result.page,
          orders: result.orders.map((o) => ({
            id: o.id,
            orderNumber: (o as Record<string, unknown>).orderNumber,
            status: o.status,
            total: (o as Record<string, unknown>).totalPrice,
            createdAt: o.createdAt,
            itemsCount: (o.items as unknown[]).length,
          })),
        };
      },
    }),

    getOrderStatus: tool({
      description: "جلب حالة طلب محدد برقمه أو ID",
      inputSchema: zodSchema(
        z.object({
          orderId: z.string().max(50).describe("رقم أو ID الطلب"),
        })
      ),
      execute: async ({ orderId }) => {
        if (!authUser) return AUTH_REQUIRED;
        try {
          const order = await getCachedOrderById(orderId, authUser.userId);
          return {
            id: order.id,
            orderNumber: (order as Record<string, unknown>).orderNumber,
            status: order.status,
            total: (order as Record<string, unknown>).totalPrice,
            createdAt: order.createdAt,
            items: (order.items as Array<Record<string, unknown>>).map((item) => ({
              name: (item.product as Record<string, unknown>)?.name,
              quantity: item.quantity,
              price: item.price,
            })),
            tracking: order.tracking,
          };
        } catch {
          return { found: false, message: "الطلب غير موجود أو لا تملك صلاحية عرضه." };
        }
      },
    }),

    getMyProfile: tool({
      description: "جلب معلومات حساب المستخدم المسجل",
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        if (!authUser) return AUTH_REQUIRED;
        const profile = await getCachedUserProfile(authUser.userId);
        return {
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          phone: profile.phone,
          emailVerified: profile.emailVerified,
          phoneVerified: profile.phoneVerified,
          memberSince: profile.createdAt,
        };
      },
    }),
  };
}
