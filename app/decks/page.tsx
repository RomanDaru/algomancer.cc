import PublicDecksClient from "./PublicDecksClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { deckService } from "@/app/lib/services/deckService";
import { cardService } from "@/app/lib/services/cardService";

export default async function PublicDecksPage({
  searchParams,
}: {
  // In Next 15, searchParams is async; await it before use
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession(authOptions);
  const sp = (await searchParams) || {};
  const cardParam = sp["card"];
  const cardId = typeof cardParam === "string" ? (cardParam as string) : undefined;

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

  // Ensure we only pass plain JSON-serializable data to the client
  const initialDecksSerializable = JSON.parse(JSON.stringify(initialDecks));
  const filteredCardSerializable = filteredCard
    ? JSON.parse(JSON.stringify(filteredCard))
    : undefined;

  return (
    <PublicDecksClient
      initialDecks={initialDecksSerializable}
      filteredCard={filteredCardSerializable}
      isAuthenticated={Boolean(session?.user?.id)}
    />
  );
}
