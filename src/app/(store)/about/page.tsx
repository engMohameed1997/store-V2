import { Store, Users, Award, Globe } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-foreground mb-8">حول الموقع</h1>

      {/* Hero */}
      <div className="bg-card rounded-2xl border border-border p-8 mb-8 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-3">
          <span className="text-primary">الـ</span>متجر
        </h2>
        <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          متجرك الإلكتروني الأول في العراق. نسعى لتوفير أفضل المنتجات بأسعار منافسة
          مع خدمة توصيل سريعة وموثوقة لجميع المحافظات العراقية.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: <Store size={24} />, value: '+1000', label: 'منتج متوفر' },
          { icon: <Users size={24} />, value: '+5000', label: 'عميل سعيد' },
          { icon: <Award size={24} />, value: '99%', label: 'رضا العملاء' },
          { icon: <Globe size={24} />, value: '18', label: 'محافظة نغطيها' },
        ].map((stat, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-5 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
              {stat.icon}
            </div>
            <p className="text-2xl font-black text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Story */}
      <div className="bg-card rounded-2xl border border-border p-8 mb-8">
        <h3 className="text-xl font-bold text-foreground mb-4">قصتنا</h3>
        <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
          <p>
            انطلقنا بهدف واحد وهو تقديم تجربة تسوق إلكتروني متكاملة ومميزة للمستهلك العراقي.
            نؤمن بأن كل شخص يستحق الحصول على منتجات عالية الجودة بأسعار عادلة وخدمة توصيل سريعة.
          </p>
          <p>
            نعمل مع أفضل الموردين والعلامات التجارية لضمان جودة كل منتج نقدمه.
            فريقنا المتخصص يعمل على مدار الساعة لضمان رضاكم التام.
          </p>
          <p>
            نفتخر بخدمة عملائنا في جميع المحافظات العراقية الـ 18، ونسعى دائماً
            لتطوير خدماتنا وتوسيع تشكيلة منتجاتنا لتلبية كافة احتياجاتكم.
          </p>
        </div>
      </div>

      {/* Values */}
      <div className="bg-card rounded-2xl border border-border p-8">
        <h3 className="text-xl font-bold text-foreground mb-4">قيمنا</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'الجودة', desc: 'نضمن أصالة وجودة كل منتج نبيعه' },
            { title: 'الشفافية', desc: 'أسعار واضحة بدون رسوم مخفية' },
            { title: 'الالتزام', desc: 'التوصيل في الموعد المحدد دائماً' },
          ].map((v, i) => (
            <div key={i} className="p-4 rounded-xl bg-primary/5 dark:bg-primary/10">
              <h4 className="font-bold text-foreground mb-1">{v.title}</h4>
              <p className="text-sm text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
