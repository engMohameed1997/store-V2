import { Truck, Clock, MapPin, Package } from 'lucide-react';

export default function DeliveryPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-foreground mb-2">التوصيل</h1>
      <p className="text-muted-foreground mb-8">نوصل إلى جميع المحافظات العراقية</p>

      {/* Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: <Truck size={22} />, label: 'توصيل لكل العراق', color: 'text-primary' },
          { icon: <Clock size={22} />, label: '1-5 أيام عمل', color: 'text-amber-500' },
          { icon: <MapPin size={22} />, label: '18 محافظة', color: 'text-emerald-500' },
          { icon: <Package size={22} />, label: 'تغليف آمن', color: 'text-purple-500' },
        ].map((item, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 text-center">
            <div className={`${item.color} mx-auto mb-2`}>{item.icon}</div>
            <p className="text-sm font-medium text-foreground">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Delivery Times */}
      <div className="bg-card rounded-2xl border border-border p-8 mb-6">
        <h2 className="text-xl font-bold text-foreground mb-4">أوقات التوصيل</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-right py-3 font-semibold text-foreground">المنطقة</th>
                <th className="text-right py-3 font-semibold text-foreground">المدة المتوقعة</th>
                <th className="text-right py-3 font-semibold text-foreground">الرسوم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-3 text-muted-foreground">بغداد</td>
                <td className="py-3 text-muted-foreground">1-2 يوم عمل</td>
                <td className="py-3 text-muted-foreground">5,000 د.ع</td>
              </tr>
              <tr>
                <td className="py-3 text-muted-foreground">كربلاء، النجف، بابل</td>
                <td className="py-3 text-muted-foreground">2-3 أيام عمل</td>
                <td className="py-3 text-muted-foreground">7,000 د.ع</td>
              </tr>
              <tr>
                <td className="py-3 text-muted-foreground">البصرة، ذي قار، ميسان</td>
                <td className="py-3 text-muted-foreground">3-4 أيام عمل</td>
                <td className="py-3 text-muted-foreground">8,000 د.ع</td>
              </tr>
              <tr>
                <td className="py-3 text-muted-foreground">أربيل، السليمانية، دهوك</td>
                <td className="py-3 text-muted-foreground">3-5 أيام عمل</td>
                <td className="py-3 text-muted-foreground">10,000 د.ع</td>
              </tr>
              <tr>
                <td className="py-3 text-muted-foreground">باقي المحافظات</td>
                <td className="py-3 text-muted-foreground">3-5 أيام عمل</td>
                <td className="py-3 text-muted-foreground">8,000 د.ع</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-4">* التوصيل مجاني للطلبات التي تزيد عن 50,000 د.ع</p>
      </div>

      {/* Info */}
      <div className="bg-card rounded-2xl border border-border p-8 mb-6">
        <h2 className="text-xl font-bold text-foreground mb-4">معلومات مهمة</h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>• يتم احتساب أيام العمل من الأحد إلى الخميس (عدا العطل الرسمية).</p>
          <p>• سيتم إرسال رسالة نصية مع رابط تتبع الشحنة فور شحن الطلب.</p>
          <p>• يتواصل معك مندوب التوصيل قبل الوصول بـ 30 دقيقة.</p>
          <p>• في حالة عدم تواجدك يمكن إعادة جدولة التوصيل مجاناً (مرة واحدة).</p>
          <p>• المنتجات الكبيرة أو الثقيلة قد تحتاج وقتاً إضافياً 1-2 يوم.</p>
        </div>
      </div>

      {/* Free Shipping */}
      <div className="promo-banner text-center">
        <h3 className="text-xl font-bold relative z-10 mb-2">🚚 توصيل مجاني</h3>
        <p className="text-white/70 relative z-10 text-sm">لجميع الطلبات فوق 50,000 دينار عراقي</p>
      </div>
    </div>
  );
}
