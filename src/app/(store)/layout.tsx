import Header from '@/components/store/header';
import Footer from '@/components/store/footer';
import { WhatsAppButton } from '@/components/store/whatsapp-button';
import PageViewTracker from '@/components/store/page-view-tracker';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppButton />
      <PageViewTracker />
    </>
  );
}
