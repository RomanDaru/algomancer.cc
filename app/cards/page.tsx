import { cardService } from "@/app/lib/services/cardService";
import CardGrid from "@/app/components/CardGrid";
import ScrollToTop from "@/app/components/ScrollToTop";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Algomancy Cards Database - Complete Card Collection",
  description:
    "Browse the complete Algomancy card database. Search and filter through all cards by element, type, mana cost, and more. Find the perfect cards for your deck.",
  keywords: [
    "algomancy cards",
    "algomancy database",
    "card search",
    "algomancy card list",
    "card collection",
    "algomancy elements",
    "card types",
    "mana cost",
  ],
  openGraph: {
    title: "Algomancy Cards Database - Complete Card Collection",
    description:
      "Browse the complete Algomancy card database. Search and filter through all cards by element, type, mana cost, and more.",
    url: "https://algomancer.cc/cards",
  },
};

export default async function CardsPage() {
  const cards = await cardService.getAllCards();

  return (
    <>
      <div className='container-fluid mx-auto px-6 py-8 max-w-[95%]'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold mb-4'>Algomancy Cards Database</h1>
          <p className='text-gray-400 text-lg max-w-3xl'>
            Explore the complete collection of Algomancy cards. Use the search
            and filter tools to find cards by element, type, mana cost, and
            more. Build your perfect deck with our comprehensive card database.
          </p>
        </div>
        <CardGrid cards={cards} />
      </div>

      {/* Scroll to Top Button */}
      <ScrollToTop showAfter={400} />
    </>
  );
}
