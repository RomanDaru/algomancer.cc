import { cardService } from "@/app/lib/services/cardService";
import CardGrid from "@/app/components/CardGrid";

export default async function CardsPage() {
  const cards = await cardService.getAllCards();

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-8'>Card Database</h1>
      <CardGrid cards={cards} />
    </div>
  );
}
