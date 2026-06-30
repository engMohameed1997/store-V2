import { CreditCard, Smartphone, Banknote, Shield, CheckCircle2 } from 'lucide-react';

export default function PaymentPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-foreground mb-2">طرق الدفع</h1>
      <p className="text-muted-foreground mb-8">نوفر لك خيارات دفع متعددة وآمنة</p>

      {/* Payment Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {[
          {
            icon: <Banknote size={28} />,
            title: 'الدفع عند الاستلام',
            desc: 'ادفع نقداً عند استلام طلبك. الطريقة الأكثر شيوعاً والأسهل.',
            color: 'text-emerald-500',
            bg: 'bg-emerald-50 dark:bg-emerald-900/10',
          },
          {
            icon: <Smartphone size={28} />,
            title: 'زين كاش',
            desc: 'ادفع عبر محفظة زين كاش الإلكترونية. سريع وآمن.',
            color: 'text-purple-500',
            bg: 'bg-purple-50 dark:bg-purple-900/10',
          },
          {
            icon: <CreditCard size={28} />,
            title: 'كي كارد (Qi Card)',
            desc: 'ادفع ببطاقة كي كارد الإلكترونية مباشرة من حسابك.',
            color: 'text-blue-500',
            bg: 'bg-blue-50 dark:bg-blue-900/10',
          },
          {
            icon: <CreditCard size={28} />,
            title: 'فاست باي (FastPay)',
            desc: 'ادفع عبر محفظة فاست باي الإلكترونية بسهولة.',
            color: 'text-amber-500',
            bg: 'bg-amber-50 dark:bg-amber-900/10',
          },
        ].map((method, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-6">
            <div className={`w-12 h-12 rounded-xl ${method.bg} flex items-center justify-center ${method.color} mb-3`}>
              {method.icon}
            </div>
            <h3 className="font-bold text-foreground mb-1">{method.title}</h3>
            <p className="text-sm text-muted-foreground">{method.desc}</p>
          </div>
        ))}
      </div>

      {/* Security */}
      <div className="bg-card rounded-2xl border border-border p-8 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={24} className="text-primary" />
          <h2 className="text-xl font-bold text-foreground">أمان الدفع</h2>
        </div>
        <div className="space-y-3">
          {[
            'جميع المعاملات مشفرة بتقنية SSL/TLS',
            'لا نحفظ بيانات بطاقاتك المصرفية على خوادمنا',
            'نستخدم بوابات دفع معتمدة ومرخصة',
            'إمكانية تتبع حالة الدفع من صفحة الطلب',
            'استرداد فوري في حالة فشل عملية الدفع',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-card rounded-2xl border border-border p-8">
        <h2 className="text-xl font-bold text-foreground mb-4">ملاحظات مهمة</h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>• عند اختيار الدفع عند الاستلام، يرجى تجهيز المبلغ المطلوب بالضبط.</p>
          <p>• للدفع الإلكتروني، تأكد من توفر رصيد كافٍ في محفظتك أو حسابك.</p>
          <p>• في حالة فشل الدفع الإلكتروني، لن يتم تأكيد الطلب ولن يُخصم أي مبلغ.</p>
          <p>• يمكنك اختيار طريقة دفع مختلفة لكل طلب.</p>
        </div>
      </div>
    </div>
  );
}
