---
description: فحص توافق الكود الجديد مع الأنماط الموجودة في المشروع
---

# Compat Check — فحص توافق الأنماط

**قبل الكتابة**: ابحث عن endpoint/service/component مشابه في المشروع واتبع نفس النمط

**API Route**: `createHandler` أو helpers • rate limit tier • `apiSuccess`/`apiError`/`apiPaginated` • Zod validator • logic في service
**Service**: يستخدم `db` مباشرة • `select` لتحديد الحقول • `throw Errors.*` • يرجع بيانات فقط (لا NextResponse)
**Component**: Tailwind classes • مكونات `ui/` • `"use client"` عند الحاجة • `cn()` لدمج classes
**Validator**: Zod • يصدّر schema + type (`z.infer`)

**✅ صحيح**: `apiSuccess(data)` • `protectedRoute(handler)` • `getJson<T>(url)` • `throw Errors.notFound()`
**❌ خطأ**: `NextResponse.json({data})` • auth يدوي • `fetch()` مباشر • `throw new Error()`

**قبل الإنهاء**: grep عن الدالة/المكون المعدل • لا تغير signature مستخدمة • لا تحذف حقل model مستخدم • لا تضيف import لمكتبة غير موجودة
