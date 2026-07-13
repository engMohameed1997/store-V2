---
description: فحص أمني متخصص للمشروع — يتحقق من الثغرات الأمنية الشائعة
---

# Security Audit — فحص أمني

**SQL Injection**: Prisma client فقط • لا `$queryRaw` إلا بـ parameterized queries
**Auth**: route handler مناسب (`publicRoute`/`protectedRoute`/`adminRoute`/`superAdminRoute`/`staffRoute`) • JWT يُتحقق تلقائياً
**IDOR**: تحقق ملكية المورد (`where: { id, userId: user.userId }`) • admin endpoints تتحقق من الدور
**Input**: Zod validator من `src/lib/validators/` • تحقق من نوع/طول/تنسيق • `sanitize.ts` إن لزم
**XSS**: لا `dangerouslySetInnerHTML` دون تنظيف • React يهرب تلقائياً • CSP headers سليمة
**CSRF**: SameSite cookies • CORS محدود بـ `ALLOWED_ORIGINS`
**Rate Limit**: tier مناسب (`auth`/`strict`/`search`/`upload`/`default`) عبر `createHandler`
**Secrets**: لا API keys في الكود • من `process.env` • لا إرجاع `passwordHash`/`twoFactorSecret` • استخدم `select`
**Upload**: تحقق MIME type • حجم • لا ملفات تنفيذية
**Errors**: لا stack traces في الإنتاج • `handleApiError` الموحد
