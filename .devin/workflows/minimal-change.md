---
description: إجبار الـ agent على أصغر تغيير ممكن وتقليل هدر التوكن
---

# Minimal Change — أصغر تغيير ممكن

**الأدوات**: `edit` (أولوية) > `multi_edit` (لتعدد في نفس ملف) > `write_to_file` (ملف جديد فقط) • اقرأ قبل التعديل
**ممنوع**: إعادة كتابة ملف كامل • ملفات مساعدة • comments • console.log • imports غير ضرورية • try/catch (route handler يلتقط) • types جديدة
**قراءة ذكية**: grep أولاً → اقرأ offset±20 فقط → edit السطور المطلوبة • لا تقرأ ملفات لا تحتاجها
**edit**: `old_string` بأصغر حجم • سياق كافٍ للتفرد • `replace_all` فقط لتكرار نفس النص
**ملف جديد**: اسأل "هل يمكن إضافته لملف موجود؟" • service → `services/` • validator → `validators/` • component → `components/`
**تحقق**: أصغر تغيير؟ • لا كود زائد؟ • `edit` بدل `write`؟ • قرأت فقط ما تحتاجه؟
