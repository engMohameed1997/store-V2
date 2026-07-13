---
description: نظرة شاملة على هيكلية المشروع وتقنياته وأنماطه المعمارية
---

# Store — هيكلية المشروع

## التقنيات
Next.js 16 (App Router) • React 19 • Prisma 7 + PostgreSQL 16 • Tailwind 4 + shadcn/ui • Zustand 5 • Upstash Redis • Firebase • Vercel AI SDK 6 • JWT • Zod 4 • Docker Compose

## المجلدات
- `src/app/(admin)/mx-panel/` — لوحة الإدارة (21 صفحة)
- `src/app/(auth)/` — login, register, verify-phone, reset-password
- `src/app/(store)/` — المتجر (products, cart, checkout, account, wishlist, search)
- `src/app/api/v1/` — REST API (81 endpoint: auth, mx-panel, products, orders, user, categories, cart, chat, uploads, etc.)
- `src/components/` — admin/ • store/ • providers/ • ui/ (shadcn)
- `src/lib/api/` — route-handler, auth-guard, response, errors, rate-limiter, jwt, cache, crud, pagination, sanitize, validate
- `src/lib/services/` — 22 service (auth, order, product, analytics, coupon, upload, telegram, ticket, cart, user, review, etc.)
- `src/lib/chatbot/` — config, guard, tools, prompt, concurrency, cache
- `src/lib/client/` — api.ts (getJson/postJson/putJson/deleteJson/uploadFile), admin.ts, auth.ts
- `src/lib/validators/` — Zod schemas • `src/lib/dto/` — DTOs • `src/lib/firebase/` — admin, client
- `src/lib/db.ts` — Prisma singleton • `src/lib/redis.ts` — Upstash • `src/lib/permissions.ts` — أدوار
- `src/proxy.ts` — Middleware (CORS, security headers, auth redirects, IP allowlist)
- `prisma/schema.prisma` — 30+ model • `docker-compose.yml` — app + db + nginx + certbot

## الأنماط
- **API**: `publicRoute` / `protectedRoute` / `adminRoute` / `superAdminRoute` / `salesRoute` / `warehouseRoute` / `customerServiceRoute`
- **Response**: `apiSuccess` / `apiError` / `apiPaginated` / `apiCreated` / `apiNoContent`
- **Service**: business logic في `services/*.service.ts` يستخدم `db` مباشرة، يرجع بيانات فقط
- **Client**: `getJson` / `postJson` / `putJson` / `deleteJson` ترجع `ApiResult<T>`
- **Auth**: JWT في cookie أو Bearer، تحقق من DB كل طلب، `optionalAuth()` للضيوف
- **Errors**: `throw Errors.notFound()` / `Errors.unauthorized()` / `Errors.forbidden()`

## الأدوار
SUPER_ADMIN (كامل) • ADMIN (كامل) • SALES (orders, users, coupons, invoices, reports) • WAREHOUSE (products, categories, brands, branches, shipping) • CUSTOMER_SERVICE (tickets, orders read, reviews, users) • CUSTOMER (storefront)

## البنية
Docker: app (Next.js standalone) + db (PostgreSQL 16) + nginx (SSL) + certbot (auto-renew)
