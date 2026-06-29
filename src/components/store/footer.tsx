'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';
import type { CategoryWithChildren } from '@/lib/types/store';

type IconProps = { size: number };

function InstagramIcon({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function FacebookIcon({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
    </svg>
  );
}

function TikTokIcon({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.73 2.89 2.89 0 0 1 2.31-4.52 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

function TelegramIcon({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.387 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function WhatsAppIcon({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

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
    { key: 'socialInstagram', label: 'انستغرام', Icon: InstagramIcon, hoverColor: '#E4405F' },
    { key: 'socialFacebook', label: 'فيسبوك', Icon: FacebookIcon, hoverColor: '#1877F2' },
    { key: 'socialTiktok', label: 'تيك توك', Icon: TikTokIcon, hoverColor: '#EE1D52' },
    { key: 'socialTelegram', label: 'تلجرام', Icon: TelegramIcon, hoverColor: '#0088CC' },
    { key: 'socialWhatsapp', label: 'واتساب', Icon: WhatsAppIcon, hoverColor: '#25D366' },
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
              <span className="text-[var(--accent)]">الـ</span>متجر
            </h3>
            <p className="text-white/70 text-sm leading-relaxed mb-4">
              متجرك الإلكتروني الأول. نوفر لك أفضل المنتجات بأفضل الأسعار مع خدمة توصيل سريعة وموثوقة لجميع المحافظات.
            </p>
            <div className="flex gap-3">
              {socialLinks.length > 0 ? socialLinks.map(({ key, label, Icon, hoverColor, href }) => (
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
                  <Icon size={18} />
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
                    href={`/category/${cat.nameAr || cat.name}`}
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
