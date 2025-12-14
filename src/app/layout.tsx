import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import LoadingBar from "@/components/LoadingBar";
import { Inter, Roboto_Mono, Orbitron, Rajdhani } from "next/font/google";
import "./globals.css";

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap", // Optimize font loading
  preload: true,
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap", // Optimize font loading
  preload: true,
});

export const metadata: Metadata = {
  title: "BookMyGame : Book Gaming Cafés Across India",
  description: "India's premier gaming café booking platform. Find, book, and play at the best gaming cafés near you.",
  applicationName: "BookMyGame",
  keywords: [
    "gaming cafe",
    "gaming cafe booking",
    "book gaming cafe",
    "gaming lounge",
    "esports cafe",
    "PS5 cafe",
    "PC gaming cafe",
    "India gaming",
  ],
  authors: [{ name: "BookMyGame" }],
  creator: "BookMyGame",
  publisher: "BookMyGame",
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://www.bookmygame.co.in",
    title: "BookMyGame - Gaming Café Booking Platform",
    description: "India's premier gaming café booking platform. Find, book, and play at the best gaming cafés near you.",
    siteName: "BookMyGame",
  },
  twitter: {
    card: "summary_large_image",
    title: "BookMyGame - Gaming Café Booking",
    description: "India's premier gaming café booking platform",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="preconnect" href="https://zlwqbmcgrrqrbyxdpqgn.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://zlwqbmcgrrqrbyxdpqgn.supabase.co" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} ${rajdhani.variable} bg-black text-white`}
        suppressHydrationWarning
      >
        <LoadingBar />
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}