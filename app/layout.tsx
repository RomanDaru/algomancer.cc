import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AuthProvider from "./providers/AuthProvider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]/route";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Improve font loading performance
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap", // Improve font loading performance
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
    other: {
      "msvalidate.01": "5C0D9110EE5355100D2FB1F74036EA73",
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang='en'>
      <head>
        {/* Resource hints for performance optimization */}
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link
          rel='preconnect'
          href='https://fonts.gstatic.com'
          crossOrigin='anonymous'
        />
        <link rel='preconnect' href='https://res.cloudinary.com' />
        <link rel='dns-prefetch' href='https://vercel.live' />
        <link rel='dns-prefetch' href='https://vitals.vercel-analytics.com' />

        {/* Critical CSS for above-the-fold content */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
            /* Critical styles for immediate rendering */
            body {
              background-color: #0a0a0a;
              color: #ededed;
              margin: 0;
              font-family: var(--font-geist-sans), system-ui, sans-serif;
            }
            .min-h-screen { min-height: 100vh; }
            .flex { display: flex; }
            .flex-col { flex-direction: column; }
            .items-center { align-items: center; }
            .justify-center { justify-content: center; }
            .text-center { text-align: center; }
            .font-bold { font-weight: 700; }
            .bg-gradient-to-b { background-image: linear-gradient(to bottom, var(--tw-gradient-stops)); }
            .from-algomancy-dark { --tw-gradient-from: #0a0a0a; --tw-gradient-to: rgb(10 10 10 / 0); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
            .to-black { --tw-gradient-to: #000; }
          `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <AuthProvider session={session}>
          <Navbar />
          <main className='flex-1'>{children}</main>
          <Footer />
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
