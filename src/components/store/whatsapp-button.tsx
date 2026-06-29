'use client';

import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { getJson } from '@/lib/client/api';

export function WhatsAppButton() {
  const [phone, setPhone] = useState('');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    // Fetch store settings for whatsapp number and greeting
    getJson<Record<string, string>>('/api/v1/settings/contact').then((result) => {
      if (result.success && result.data) {
        setPhone(result.data.socialWhatsapp || '');
        setGreeting(result.data.whatsappGreeting || '');
      }
    }).catch(() => {});
  }, []);

  if (!phone) return null;

  // Clean the phone number: remove spaces, dashes, bidi control chars, and all non-numeric except +
  const cleanPhone = phone.replace(/[^\d+]/g, '');

  const whatsappUrl = `https://wa.me/${cleanPhone}${greeting ? `?text=${encodeURIComponent(greeting)}` : ''}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل معنا عبر واتساب"
      className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105 group"
    >
      <MessageCircle size={22} className="shrink-0" />
      <span className="text-sm font-medium hidden sm:inline group-hover:inline">تواصل معنا</span>
    </a>
  );
}
