import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deck Building Competitions - Algomancer.cc",
  description: "Join exciting Algomancy deck building competitions! Compete in Constructed and Draft formats, showcase your skills, and win recognition in the community.",
  keywords: [
    "algomancy competitions",
    "deck building contest", 
    "algomancy tournament",
    "constructed format",
    "draft format",
    "deck building challenge",
    "algomancy community",
    "competitive deck building"
  ],
  openGraph: {
    title: "Deck Building Competitions - Algomancer.cc",
    description: "Join exciting Algomancy deck building competitions! Compete in Constructed and Draft formats.",
    url: "https://algomancer.cc/competitions",
  },
};

export default function CompetitionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
