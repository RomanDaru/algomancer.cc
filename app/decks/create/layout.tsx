import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Algomancy Deck - Free Deck Builder Tool",
  description: "Build your perfect Algomancy deck with our free deck builder. Search cards, analyze statistics, and create powerful combinations. No signup required to start building!",
  keywords: [
    "algomancy deck builder",
    "create algomancy deck",
    "deck building tool",
    "free deck builder",
    "algomancy deck creator",
    "build deck online",
    "algomancy strategy",
    "deck construction"
  ],
  openGraph: {
    title: "Create Algomancy Deck - Free Deck Builder Tool",
    description: "Build your perfect Algomancy deck with our free deck builder. Search cards, analyze statistics, and create powerful combinations.",
    url: "https://algomancer.cc/decks/create",
  },
};

export default function CreateDeckLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
