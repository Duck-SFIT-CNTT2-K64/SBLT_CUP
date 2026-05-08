import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/layout/Providers";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AnnouncementPopup from "@/components/layout/AnnouncementPopup";

const inter = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-inter" });

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
    <html lang="vi" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-sblt-black text-sblt-white font-sans" suppressHydrationWarning>
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <AnnouncementPopup />
        </Providers>
      </body>
    </html>
  );
}
