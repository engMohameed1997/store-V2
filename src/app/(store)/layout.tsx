import Header from '@/components/store/header';
import Footer from '@/components/store/footer';
import { WhatsAppButton } from '@/components/store/whatsapp-button';
import PageViewTracker from '@/components/store/page-view-tracker';
import { ChatWidget } from '@/components/store/chat/chat-widget';
import MobileBottomNav from '@/components/store/mobile-bottom-nav';
import { CategoryService } from '@/lib/services/category.service';
import { serialize } from '@/lib/utils/serialize';
import type { CategoryWithChildren } from '@/lib/types/store';
import { db } from '@/lib/db';

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [categories, contactSettings] = await Promise.all([
    CategoryService.list().catch(() => []),
    db.storeSetting.findMany({
      where: { key: { in: ["socialWhatsapp", "socialTelegram", "socialFacebook", "socialInstagram", "socialTiktok", "whatsappGreeting", "storePhone", "storePhone2", "storeEmail", "storeAddress", "storeName", "storeNameAr"] } },
    }).catch(() => []),
  ]);
  const serializedCategories = serialize(categories) as CategoryWithChildren[];
  const contact: Record<string, string> = {};
  for (const s of contactSettings) contact[s.key] = s.value as string;

  return (
    <>
      <Header categories={serializedCategories} />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer categories={serializedCategories} contact={contact} />
      <WhatsAppButton contact={contact} />
      <PageViewTracker />
      <ChatWidget />
      <MobileBottomNav />
    </>
  );
}
