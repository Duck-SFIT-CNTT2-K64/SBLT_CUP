import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import Providers from "@/components/layout/Providers";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AnnouncementPopup from "@/components/layout/AnnouncementPopup";
import { GlobalChatPanel } from "@/components/social/GlobalChatPanel";
import JsonLd from "@/components/JsonLd";

const inter = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-inter" });
const oswald = Oswald({ subsets: ["latin", "vietnamese"], weight: ["400", "700"], variable: "--font-oswald" });

const BASE_URL = process.env.NEXTAUTH_URL || "https://sbltcup.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "SBLT CUP - Giải Đấu TFT",
    template: "%s | SBLT CUP",
  },
  description: "Giải đấu Đấu Trường Chân Lý (TFT) SBLT CUP - Team 5van & Koi tổ chức. Sân chơi giao lưu cộng đồng TFT Việt Nam.",
  keywords: ["TFT", "Đấu Trường Chân Lý", "SBLT CUP", "giải đấu TFT", "5van", "Koi", "esports Việt Nam"],
  authors: [{ name: "Team 5van & Koi" }],
  creator: "SBLT CUP",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: BASE_URL,
    siteName: "SBLT CUP",
    title: "SBLT CUP - Giải Đấu TFT",
    description: "Giải đấu Đấu Trường Chân Lý (TFT) SBLT CUP - Team 5van & Koi tổ chức.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SBLT CUP - Giải Đấu TFT",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SBLT CUP - Giải Đấu TFT",
    description: "Giải đấu Đấu Trường Chân Lý (TFT) SBLT CUP - Team 5van & Koi tổ chức.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} ${oswald.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#dc2626" />
      </head>
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-[#f5f5f5] font-sans antialiased" suppressHydrationWarning>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#dc2626] focus:text-white focus:rounded">
          Chuyển đến nội dung chính
        </a>
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "SBLT CUP",
          "url": BASE_URL,
          "logo": `${BASE_URL}/logo.png`,
          "description": "Giải đấu Đấu Trường Chân Lý (TFT) SBLT CUP",
        }} />
        <Providers>
          <Navbar />
          <main id="main-content" role="main" className="flex-1">{children}</main>
          <Footer />
          <AnnouncementPopup />
          <GlobalChatPanel />
        </Providers>
      </body>
    </html>
  );
}
