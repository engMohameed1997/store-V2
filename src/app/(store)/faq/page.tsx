'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    category: 'الطلبات والشراء',
    items: [
      { q: 'كيف أقوم بطلب منتج؟', a: 'اختر المنتج المطلوب، أضفه إلى السلة، ثم اتبع خطوات إتمام الطلب باختيار عنوان التوصيل وطريقة الدفع.' },
      { q: 'هل يمكنني تعديل طلبي بعد تأكيده؟', a: 'يمكنك تعديل الطلب خلال أول ساعة من تأكيده عبر التواصل مع خدمة العملاء. بعد ذلك قد لا يكون التعديل ممكناً.' },
      { q: 'ما هي طرق الدفع المتاحة؟', a: 'نقبل الدفع عند الاستلام، زين كاش، كي كارد، وفاست باي.' },
      { q: 'هل يمكنني إلغاء طلبي؟', a: 'نعم، يمكنك إلغاء الطلب قبل شحنه. بعد الشحن يمكنك رفض الاستلام أو طلب إرجاع.' },
    ],
  },
  {
    category: 'التوصيل',
    items: [
      { q: 'كم يستغرق التوصيل؟', a: 'التوصيل داخل بغداد: 1-2 يوم عمل. المحافظات: 2-5 أيام عمل.' },
      { q: 'هل التوصيل مجاني؟', a: 'التوصيل مجاني للطلبات فوق 50,000 د.ع. للطلبات الأقل تُحسب رسوم التوصيل حسب المحافظة.' },
      { q: 'هل تتوفر خدمة التوصيل لجميع المحافظات؟', a: 'نعم، نوفر التوصيل لجميع المحافظات العراقية الـ 18.' },
    ],
  },
  {
    category: 'الإرجاع والاستبدال',
    items: [
      { q: 'ما هي سياسة الإرجاع؟', a: 'يمكنك إرجاع المنتج خلال 14 يوماً من الاستلام بشرط أن يكون بحالته الأصلية مع العبوة.' },
      { q: 'كيف أطلب إرجاع منتج؟', a: 'من صفحة "طلباتي" اختر الطلب ثم اضغط على "طلب إرجاع" واتبع التعليمات.' },
      { q: 'متى أسترد أموالي؟', a: 'يتم استرداد المبلغ خلال 3-7 أيام عمل بعد استلام المنتج المرتجع وفحصه.' },
    ],
  },
  {
    category: 'الحساب والأمان',
    items: [
      { q: 'كيف أنشئ حساباً؟', a: 'اضغط على "إنشاء حساب" وأدخل بياناتك (بريد إلكتروني أو رقم هاتف) مع كلمة مرور.' },
      { q: 'نسيت كلمة المرور', a: 'اضغط على "نسيت كلمة المرور" في صفحة تسجيل الدخول وسنرسل لك رابط إعادة التعيين.' },
      { q: 'هل معلوماتي الشخصية آمنة؟', a: 'نعم، نستخدم أحدث تقنيات التشفير لحماية بياناتك الشخصية وبيانات الدفع.' },
    ],
  },
];

export default function FaqPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-foreground mb-2">أسئلة شائعة</h1>
      <p className="text-muted-foreground mb-8">إجابات على أكثر الأسئلة شيوعاً</p>

      <div className="space-y-8">
        {faqs.map((section, si) => (
          <div key={si}>
            <h2 className="text-lg font-bold text-foreground mb-3">{section.category}</h2>
            <div className="space-y-2">
              {section.items.map((item, ii) => {
                const key = `${si}-${ii}`;
                const isOpen = openItems.has(key);
                return (
                  <div key={key} className="bg-card rounded-xl border border-border overflow-hidden">
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between p-4 text-right hover:bg-muted/50 transition"
                    >
                      <span className="font-medium text-foreground text-sm">{item.q}</span>
                      <ChevronDown size={16} className={`text-muted-foreground flex-shrink-0 mr-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3 animate-fade-in">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
