import PublicDecksClient from "./PublicDecksClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { deckService } from "@/app/lib/services/deckService";
import { cardService } from "@/app/lib/services/cardService";
import { PUBLIC_DECKS_PAGE_SIZE } from "@/app/lib/constants";

type PublicDeckPageData = Awaited<
  ReturnType<typeof deckService.getPublicDecksWithUserInfo>
>;
type CardFilteredDeckPageData = Awaited<
  ReturnType<typeof deckService.getDecksContainingCardWithUserInfo>
>;
type InitialDeckPageData = PublicDeckPageData | CardFilteredDeckPageData;
type FilteredCardData = Awaited<ReturnType<typeof cardService.getCardById>>;

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

  let initialDecks: InitialDeckPageData = [];
  let filteredCard: FilteredCardData;
  let initialHasMore = false;

  if (cardId) {
    // Specific card context
    filteredCard = await cardService.getCardById(cardId);
    initialDecks = await deckService.getDecksContainingCardWithUserInfo(cardId, 40);
  } else {
    // First page of public decks, newest first, with like status if logged in
    const initialResults = await deckService.getPublicDecksWithUserInfo(
      "newest",
      PUBLIC_DECKS_PAGE_SIZE + 1,
      0,
      session?.user?.id
    );
    initialHasMore = initialResults.length > PUBLIC_DECKS_PAGE_SIZE;
    initialDecks = initialHasMore
      ? initialResults.slice(0, PUBLIC_DECKS_PAGE_SIZE)
      : initialResults;
  }

  // Ensure we only pass plain JSON-serializable data to the client
  const initialDecksSerializable = JSON.parse(JSON.stringify(initialDecks));
  const filteredCardSerializable = filteredCard
    ? JSON.parse(JSON.stringify(filteredCard))
    : undefined;

  return (
    <PublicDecksClient
      initialDecks={initialDecksSerializable}
      initialHasMore={initialHasMore}
      filteredCard={filteredCardSerializable}
      isAuthenticated={Boolean(session?.user?.id)}
    />
  );
}
