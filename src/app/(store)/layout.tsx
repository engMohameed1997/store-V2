import Header from '@/components/store/header';
import Footer from '@/components/store/footer';
import { WhatsAppButton } from '@/components/store/whatsapp-button';
import PageViewTracker from '@/components/store/page-view-tracker';
import { ChatWidget } from '@/components/store/chat/chat-widget';
import MobileBottomNav from '@/components/store/mobile-bottom-nav';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer />
      <WhatsAppButton />
      <PageViewTracker />
      <ChatWidget />
      <MobileBottomNav />
    </>
  );
}
