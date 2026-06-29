'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Phone, MapPin } from 'lucide-react';
import type { CategoryWithChildren } from '@/lib/types/store';

export default function Footer() {
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [social, setSocial] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/v1/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success) setCategories(data.data);
      })
      .catch(() => { });

    fetch('/api/v1/settings/contact')
      .then(res => res.json())
      .then(data => {
        if (data.success) setSocial(data.data);
      })
      .catch(() => { });
  }, []);

  const socialLinks = [
    { key: 'socialInstagram', label: 'انستغرام', icon: '/icons/instagram.svg', hoverColor: '#E4405F' },
    { key: 'socialFacebook', label: 'فيسبوك', icon: '/icons/facebook.svg', hoverColor: '#1877F2' },
    { key: 'socialTiktok', label: 'تيك توك', icon: '/icons/tiktok.svg', hoverColor: '#EE1D52' },
    { key: 'socialTelegram', label: 'تلجرام', icon: '/icons/telegram.svg', hoverColor: '#0088CC' },
    { key: 'socialWhatsapp', label: 'واتساب', icon: '/icons/whatsapp.svg', hoverColor: '#25D366' },
  ].filter(s => social[s.key])
    .map(s => {
      let href = social[s.key];
      if (s.key === 'socialWhatsapp') {
        const cleanPhone = href.replace(/[^\d+]/g, '');
        href = `https://wa.me/${cleanPhone}`;
      }
      return { ...s, href };
    });

  return (
    <footer className="bg-primary text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4">
              {social.storeNameAr || social.storeName || <><span className="text-[var(--accent)]">الـ</span>متجر</>}
            </h3>
            <p className="text-white/70 text-sm leading-relaxed mb-4">
              متجرك الإلكتروني الأول. نوفر لك أفضل المنتجات بأفضل الأسعار مع خدمة توصيل سريعة وموثوقة لجميع المحافظات.
            </p>
            <div className="flex gap-3">
              {socialLinks.length > 0 ? socialLinks.map(({ key, label, icon, hoverColor, href }) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  aria-label={label}
                  style={{ ['--hover-color' as string]: hoverColor }}
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[var(--hover-color)] transition-all duration-300 hover:scale-110"
                >
                  <img src={icon} alt={label} width={18} height={18} className="invert" />
                </a>
              )) : (
                <p className="text-white/40 text-xs">لم تتم إضافة روابط تواصل بعد</p>
              )}
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
                    {cat.nameAr || cat.name}
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
              {social.storePhone && (
                <li className="flex items-center gap-2 text-white/70">
                  <Phone size={16} className="text-[var(--accent)]" />
                  <span dir="ltr">{social.storePhone}</span>
                </li>
              )}
              {social.storePhone2 && (
                <li className="flex items-center gap-2 text-white/70">
                  <Phone size={16} className="text-[var(--accent)]" />
                  <span dir="ltr">{social.storePhone2}</span>
                </li>
              )}
              {social.storeAddress && (
                <li className="flex items-center gap-2 text-white/70">
                  <MapPin size={16} className="text-[var(--accent)]" />
                  {social.storeAddress}
                </li>
              )}
              {!social.storePhone && !social.storeAddress && (
                <li className="text-white/40 text-xs">لم تتم إضافة معلومات تواصل بعد</li>
              )}
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
          <p>&copy; {new Date().getFullYear()} {social.storeNameAr || social.storeName || 'المتجر'}. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
