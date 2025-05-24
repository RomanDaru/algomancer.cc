import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AuthProvider from "./providers/AuthProvider";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Algomancer.cc - Ultimate Algomancy Deck Builder & Card Database",
    template: "%s | Algomancer.cc",
  },
  description:
    "Build powerful Algomancy decks with our comprehensive deck builder and card database. Search cards, create decks, and join the Algomancy community. The ultimate tool for Algomancy players.",
  keywords: [
    "algomancy deck builder",
    "algomancy cards",
    "algomancy database",
    "deck builder",
    "card game",
    "algomancy community",
    "algomancy decks",
    "card search",
    "deck building tool",
  ],
  authors: [{ name: "Algomancer.cc Team" }],
  creator: "Algomancer.cc",
  publisher: "Algomancer.cc",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://algomancer.cc"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Algomancer.cc - Ultimate Algomancy Deck Builder",
    description:
      "Build powerful Algomancy decks with our comprehensive deck builder and card database. Join the Algomancy community today!",
    url: "https://algomancer.cc",
    siteName: "Algomancer.cc",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Algomancer.cc - Algomancy Deck Builder",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Algomancer.cc - Ultimate Algomancy Deck Builder",
    description:
      "Build powerful Algomancy decks with our comprehensive deck builder and card database.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "4RXCpQTGpClMZvyWmJbc-m_5-18TgSCHoiAhYWdhj4g",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <AuthProvider>
          <Navbar />
          <main className='flex-1'>{children}</main>
          <Footer />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
