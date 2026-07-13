---
description: Checklist شامل يراجع الـ agent نفسه قبل إنهاء أي تعديل كود
---

# Review Checklist — راجع نفسك قبل الإنهاء

**توافق**: نفس أنماط المشروع (route-handler, service, response, client, Zod) • camelCase/PascalCase • لا مكتبات جديدة
**معمارية**: الكود في مكانه الصحيح • لا تكرار • لا يكسر وظائف موجودة (grep للتأكد)
**أمان**: Zod validation • Prisma فقط (لا SQL خام) • route handler مناسب • IDOR (تحقق ملكية) • لا secrets في الكود • rate limit
**Imports**: في أعلى الملف • مسارات `@/` • لا imports/متغيرات غير مستخدمة
**تشغيل**: يعمل فوراً • deps مثبتة • types صحيحة • اختبر مساري النجاح والفشل
**نهائي**: اقرأ الملف المعدل • هل يحل المشكلة فعلاً؟ أصلح أي فشل **قبل** إبلاغ المستخدم
