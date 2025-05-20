import { cardService } from "@/app/lib/services/cardService";
import CardGrid from "@/app/components/CardGrid";

export default async function CardsPage() {
  const cards = await cardService.getAllCards();

  return (
    <div className='container-fluid mx-auto px-6 py-8 max-w-[95%]'>
      <h1 className='text-3xl font-bold mb-8'>Card Database</h1>
      <CardGrid cards={cards} />
    </div>
  );
}
