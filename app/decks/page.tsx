import PublicDecksClient from "./PublicDecksClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { deckService } from "@/app/lib/services/deckService";
import { cardService } from "@/app/lib/services/cardService";

export default async function PublicDecksPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const session = await getServerSession(authOptions);
  const cardId = typeof searchParams?.card === "string" ? (searchParams!.card as string) : undefined;

  let initialDecks: any[] = [];
  let filteredCard: any = null;

  if (cardId) {
    // Specific card context
    filteredCard = await cardService.getCardById(cardId);
    initialDecks = await deckService.getDecksContainingCardWithUserInfo(cardId, 40);
  } else {
    // First page of public decks, newest first, with like status if logged in
    initialDecks = await deckService.getPublicDecksWithUserInfo(
      "newest",
      36,
      0,
      session?.user?.id
    );
  }

  return (
    <PublicDecksClient
      initialDecks={initialDecks}
      filteredCard={filteredCard || undefined}
      isAuthenticated={Boolean(session?.user?.id)}
    />
  );
}

