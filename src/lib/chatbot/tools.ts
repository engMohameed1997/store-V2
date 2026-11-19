import { tool, zodSchema } from "ai";
import { z } from "zod";
import type { AuthUser } from "@/lib/api/auth-guard";
import {
  getCachedUserOrders,
  getCachedOrderById,
  getCachedUserProfile,
} from "./cache";
import { searchCatalog, getProductDetail, type ChatProductCard } from "./search";

const AUTH_REQUIRED = { requiresAuth: true, message: "يرجى تسجيل الدخول أولاً للوصول إلى هذه المعلومات." };

/**
 * The widget renders product cards (image, price, link) straight from the
 * tool output, so the model gets the same products without image URLs or
 * links — it has nothing to paste (or invent) into its reply.
 */
function forModel(p: ChatProductCard) {
  return {
    slug: p.slug,
    name: p.name,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    inStock: p.inStock,
    brand: p.brand,
    category: p.category,
  };
}

export function buildTools(authUser: AuthUser | null) {
  return {
    searchProducts: tool({
      description:
        "البحث عن منتجات المتجر. ضع نوع المنتج أو اسمه أو رقم موديله في query، والماركة في brand، والميزانية في maxPrice. " +
        "النتائج تُعرض للعميل كبطاقات بالصور والأسعار تلقائياً.",
      inputSchema: zodSchema(
        z.object({
          query: z
            .string()
            .max(100)
            .describe("نوع المنتج أو اسمه أو موديله، مثل: ثلاجة، غسالة 10 كغم، RFG-549. بدون الماركة وبدون أوصاف عامة مثل كبير أو رخيص"),
          brand: z.string().max(40).optional().describe("الماركة إن ذكرها العميل، بالإنجليزية إن أمكن: LG، Samsung، Hitachi"),
          minPrice: z.number().min(0).optional().describe("أقل سعر بالدينار العراقي"),
          maxPrice: z.number().min(0).optional().describe("أعلى سعر بالدينار العراقي"),
          sort: z
            .enum(["relevance", "price_asc", "price_desc"])
            .optional()
            .describe("ترتيب النتائج: price_asc للأرخص أولاً، price_desc للأغلى أولاً"),
        })
      ),
      execute: async (input) => searchCatalog(input),
      toModelOutput: ({ output }) => ({
        type: "json",
        value: {
          ...output,
          products: output.products.map(forModel),
          ...(output.found && !output.exact
            ? { note: "لا يوجد منتج يطابق كل كلمات البحث؛ هذه أقرب النتائج." }
            : {}),
        },
      }),
    }),

    getProductDetails: tool({
      description: "تفاصيل ومواصفات منتج محدد، باستخدام الـ slug من نتائج البحث",
      inputSchema: zodSchema(
        z.object({
          productId: z.string().max(200).describe("الـ slug أو معرف المنتج"),
        })
      ),
      execute: async ({ productId }) => {
        const detail = await getProductDetail(productId);
        return detail ? { found: true as const, ...detail } : { found: false as const, message: "المنتج غير موجود." };
      },
      toModelOutput: ({ output }) => ({
        type: "json",
        value: output.found ? { ...output, product: forModel(output.product) } : output,
      }),
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
