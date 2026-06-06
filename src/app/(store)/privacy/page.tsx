export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-foreground mb-2">سياسة الخصوصية</h1>
      <p className="text-muted-foreground mb-8">آخر تحديث: يناير 2025</p>

      <div className="bg-card rounded-2xl border border-border p-8 space-y-8">
        {/* 1 */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">1. المعلومات التي نجمعها</h2>
          <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
            <p>نقوم بجمع المعلومات التالية عند استخدامك لموقعنا:</p>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>الاسم الكامل ومعلومات الاتصال (بريد إلكتروني، رقم هاتف)</li>
              <li>عنوان التوصيل</li>
              <li>سجل الطلبات والمشتريات</li>
              <li>معلومات الجهاز والمتصفح (IP, cookies)</li>
              <li>بيانات التفاعل مع الموقع (الصفحات المزارة، المنتجات المعروضة)</li>
            </ul>
          </div>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">2. كيف نستخدم معلوماتك</h2>
          <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>معالجة وتوصيل طلباتك</li>
              <li>التواصل معك بخصوص طلباتك وحسابك</li>
              <li>تحسين تجربة التسوق وتخصيص المحتوى</li>
              <li>إرسال العروض والتحديثات (بموافقتك)</li>
              <li>منع الاحتيال وحماية أمان الموقع</li>
              <li>الامتثال للمتطلبات القانونية</li>
            </ul>
          </div>
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">3. حماية البيانات</h2>
          <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
            <p>نلتزم بأعلى معايير حماية البيانات:</p>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>تشفير SSL/TLS لجميع الاتصالات</li>
              <li>تشفير كلمات المرور بخوارزميات متقدمة</li>
              <li>حماية قواعد البيانات بجدران حماية متعددة</li>
              <li>مراجعة أمنية دورية للنظام</li>
              <li>صلاحيات وصول محدودة للموظفين</li>
            </ul>
          </div>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">4. مشاركة البيانات</h2>
          <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
            <p>لا نبيع أو نؤجر معلوماتك الشخصية لأطراف ثالثة. نشارك بياناتك فقط مع:</p>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>شركات التوصيل (الاسم، العنوان، رقم الهاتف فقط)</li>
              <li>بوابات الدفع الإلكتروني (للمعاملات المالية)</li>
              <li>الجهات القانونية (عند الطلب الرسمي فقط)</li>
            </ul>
          </div>
        </section>

        {/* 5 */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">5. ملفات تعريف الارتباط (Cookies)</h2>
          <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
            <p>نستخدم ملفات تعريف الارتباط لـ:</p>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>الحفاظ على تسجيل دخولك</li>
              <li>تذكر تفضيلاتك (اللغة، الوضع المظلم)</li>
              <li>تحليل استخدام الموقع لتحسين الأداء</li>
            </ul>
            <p>يمكنك تعطيل الكوكيز من إعدادات المتصفح، لكن بعض الميزات قد لا تعمل بشكل صحيح.</p>
          </div>
        </section>

        {/* 6 */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">6. حقوقك</h2>
          <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
            <p>لديك الحق في:</p>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>الوصول إلى بياناتك الشخصية</li>
              <li>تصحيح أو تحديث معلوماتك</li>
              <li>حذف حسابك وبياناتك</li>
              <li>إلغاء الاشتراك من القوائم البريدية</li>
              <li>طلب نسخة من بياناتك</li>
            </ul>
            <p>للتواصل بخصوص الخصوصية: privacy@store.iq</p>
          </div>
        </section>

        {/* 7 */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">7. التحديثات</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. سنعلمك بأي تغييرات جوهرية
            عبر البريد الإلكتروني أو إشعار على الموقع. استمرارك في استخدام الموقع
            يعني موافقتك على السياسة المحدّثة.
          </p>
        </section>
      </div>
    </div>
  );
}
