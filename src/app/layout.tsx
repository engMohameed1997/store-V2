import type { Metadata } from "next";
import { Cairo, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { CartWishlistProvider } from "@/components/providers/cart-wishlist-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "الخزاعي - تسوق اونلاين",
  description: "متجرك الإلكتروني - تسوق أفضل المنتجات مع توصيل سريع وأسعار منافسة",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${cairo.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={`${cairo.className} min-h-full flex flex-col`}>
        <ThemeProvider>
          <AuthProvider>
            <CartWishlistProvider>
              {children}
              <Toaster position="top-center" richColors closeButton />
            </CartWishlistProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
