import { RefreshCw, CheckCircle2, XCircle, Clock, Package } from 'lucide-react';

export default function ReturnsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-foreground mb-2">سياسة الاسترجاع</h1>
      <p className="text-muted-foreground mb-8">نريدك أن تكون راضياً تماماً عن مشترياتك</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-xl border border-border p-5 text-center">
          <Clock size={28} className="mx-auto text-primary mb-2" />
          <p className="font-bold text-foreground">14 يوماً</p>
          <p className="text-xs text-muted-foreground">مهلة الإرجاع</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 text-center">
          <RefreshCw size={28} className="mx-auto text-emerald-500 mb-2" />
          <p className="font-bold text-foreground">مجاني</p>
          <p className="text-xs text-muted-foreground">لا رسوم إرجاع</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 text-center">
          <Package size={28} className="mx-auto text-amber-500 mb-2" />
          <p className="font-bold text-foreground">3-7 أيام</p>
          <p className="text-xs text-muted-foreground">لاسترداد المبلغ</p>
        </div>
      </div>

      {/* Conditions */}
      <div className="bg-card rounded-2xl border border-border p-8 mb-6">
        <h2 className="text-xl font-bold text-foreground mb-4">شروط الإرجاع</h2>
        <div className="space-y-3">
          {[
            'أن يكون المنتج بحالته الأصلية غير مستخدم',
            'أن تكون العبوة والملحقات كاملة',
            'أن يكون الإرجاع خلال 14 يوماً من تاريخ الاستلام',
            'إرفاق فاتورة الشراء أو رقم الطلب',
            'المنتجات التالفة عند الاستلام تُرجع فوراً',
          ].map((condition, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{condition}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Not eligible */}
      <div className="bg-card rounded-2xl border border-border p-8 mb-6">
        <h2 className="text-xl font-bold text-foreground mb-4">منتجات لا تُقبل إرجاعها</h2>
        <div className="space-y-3">
          {[
            'المنتجات المستخدمة أو التي تم فتح غلافها (عطور، مستحضرات تجميل)',
            'الملابس الداخلية والجوارب',
            'المنتجات الرقمية وبطاقات الشحن',
            'المنتجات المُصنعة حسب الطلب',
            'المنتجات التي مر عليها أكثر من 14 يوماً',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <XCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="bg-card rounded-2xl border border-border p-8">
        <h2 className="text-xl font-bold text-foreground mb-4">خطوات الإرجاع</h2>
        <div className="space-y-4">
          {[
            { step: '1', title: 'تقديم طلب إرجاع', desc: 'من صفحة "طلباتي" اختر الطلب واضغط "طلب إرجاع"' },
            { step: '2', title: 'موافقة الفريق', desc: 'سيراجع فريقنا الطلب ويتواصل معك خلال 24 ساعة' },
            { step: '3', title: 'إرسال المنتج', desc: 'سنرسل مندوب لاستلام المنتج من عنوانك' },
            { step: '4', title: 'استرداد المبلغ', desc: 'بعد فحص المنتج يتم استرداد المبلغ خلال 3-7 أيام عمل' },
          ].map((s, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                {s.step}
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">{s.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
