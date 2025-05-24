import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Algomancy Community Decks - Browse & Share Decks",
  description: "Discover powerful Algomancy decks shared by the community. Browse by element, popularity, or newest additions. Get inspired and create your own deck.",
  keywords: [
    "algomancy decks",
    "algomancy community",
    "deck sharing",
    "popular decks",
    "algomancy deck ideas",
    "community builds",
    "deck inspiration",
    "algomancy strategies"
  ],
  openGraph: {
    title: "Algomancy Community Decks - Browse & Share Decks",
    description: "Discover powerful Algomancy decks shared by the community. Browse by element, popularity, or newest additions.",
    url: "https://algomancer.cc/decks",
  },
};

export default function DecksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
