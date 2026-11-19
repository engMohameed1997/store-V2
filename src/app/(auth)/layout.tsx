import { connection } from "next/server";
import Header from "@/components/store/header";
import Footer from "@/components/store/footer";
import { WhatsAppButton } from "@/components/store/whatsapp-button";
import { AuthOptionsProvider } from "@/components/store/google-sign-in";
import { isGoogleAuthConfigured } from "@/lib/api/google-oauth";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Rendered per request: the Google sign-in flag comes from the runtime env.
  await connection();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <AuthOptionsProvider google={isGoogleAuthConfigured()}>{children}</AuthOptionsProvider>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
