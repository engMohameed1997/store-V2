'use client';

import { MessageCircle } from 'lucide-react';

export function WhatsAppButton({ contact }: { contact: Record<string, string> }) {
  const phone = contact.socialWhatsapp || '';
  const greeting = contact.whatsappGreeting || '';

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
      className="fixed bottom-20 left-4 md:bottom-6 md:left-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105 group"
    >
      <MessageCircle size={22} className="shrink-0" />
      <span className="text-sm font-medium hidden sm:inline group-hover:inline">تواصل معنا</span>
    </a>
  );
}
