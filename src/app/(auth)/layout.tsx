import Header from "@/components/store/header";
import Footer from "@/components/store/footer";
import { WhatsAppButton } from "@/components/store/whatsapp-button";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
