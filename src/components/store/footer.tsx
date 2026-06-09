'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';
import type { CategoryWithChildren } from '@/lib/types/store';

export default function Footer() {
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);

  useEffect(() => {
    fetch('/api/v1/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success) setCategories(data.data);
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-primary text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4">
              <span className="text-[var(--accent)]">الـ</span>متجر
            </h3>
            <p className="text-white/70 text-sm leading-relaxed mb-4">
              متجرك الإلكتروني الأول. نوفر لك أفضل المنتجات بأفضل الأسعار مع خدمة توصيل سريعة وموثوقة لجميع المحافظات.
            </p>
            <div className="flex gap-3">
              {[
                { name: 'فيسبوك', letter: 'F' },
                { name: 'انستغرام', letter: 'I' },
                { name: 'تويتر', letter: 'X' },
                { name: 'يوتيوب', letter: 'Y' },
              ].map(s => (
                <a
                  key={s.letter}
                  href="#"
                  title={s.name}
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[var(--accent)] transition-all duration-300 hover:scale-110 text-sm font-bold"
                >
                  {s.letter}
                </a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-bold mb-4 text-lg">التصنيفات</h4>
            <ul className="space-y-2">
              {categories.slice(0, 8).map(cat => (
                <li key={cat.id}>
                  <Link
                    href={`/category/${cat.slug}`}
                    className="text-white/70 hover:text-[var(--accent)] transition text-sm"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-bold mb-4 text-lg">خدمة العملاء</h4>
            <ul className="space-y-2 text-sm">
              {[
                ['حول الموقع', '/about'],
                ['أسئلة شائعة', '/faq'],
                ['سياسة الاسترجاع', '/returns'],
                ['التوصيل', '/delivery'],
                ['طرق الدفع', '/payment'],
                ['سياسة الخصوصية', '/privacy'],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-white/70 hover:text-[var(--accent)] transition">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4 text-lg">تواصل معنا</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-white/70">
                <Phone size={16} className="text-[var(--accent)]" />
                <span dir="ltr">+964 770 0000000</span>
              </li>
              <li className="flex items-center gap-2 text-white/70">
                <Mail size={16} className="text-[var(--accent)]" />
                info@store.iq
              </li>
              <li className="flex items-center gap-2 text-white/70">
                <MapPin size={16} className="text-[var(--accent)]" />
                العراق
              </li>
            </ul>
            <div className="mt-6">
              <h5 className="font-medium mb-2 text-sm">طرق الدفع المتاحة</h5>
              <div className="flex gap-2">
                {['زين كاش', 'كي كارد', 'نقداً'].map((method, i) => (
                  <span key={i} className="px-3 py-1.5 bg-white/10 rounded-lg text-xs font-medium">
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between text-sm text-white/50">
          <p>&copy; {new Date().getFullYear()} متجر الخزاعي الإلكتروني. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
