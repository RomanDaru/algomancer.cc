import PublicDecksClient from "./PublicDecksClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { deckService } from "@/app/lib/services/deckService";
import { cardService } from "@/app/lib/services/cardService";
import { PUBLIC_DECKS_PAGE_SIZE } from "@/app/lib/constants";
import { buildE2EPublicDeckResponse } from "./e2eMockData";

type InitialDeckPageResponse = Awaited<
  ReturnType<typeof deckService.getPublicDecksPage>
>;
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
  const e2eParam = sp["e2e"];
  const cardId = typeof cardParam === "string" ? (cardParam as string) : undefined;
  const isE2EMock =
    process.env.ENABLE_E2E_MOCK_DECKS === "1" && e2eParam === "1";

  let initialResponse: InitialDeckPageResponse = {
    decks: [],
    total: 0,
    hasMore: false,
    nextCursor: null,
    effectiveLimit: PUBLIC_DECKS_PAGE_SIZE,
    warnings: [],
  };
  let filteredCard: FilteredCardData;

  if (isE2EMock) {
    initialResponse = buildE2EPublicDeckResponse();
  } else if (cardId) {
    filteredCard = await cardService.getCardById(cardId);
    initialResponse = await deckService.getDecksContainingCardPage({
      cardId,
      limit: PUBLIC_DECKS_PAGE_SIZE,
      currentUserId: session?.user?.id,
    });
  } else {
    initialResponse = await deckService.getPublicDecksPage({
      sortBy: "newest",
      limit: PUBLIC_DECKS_PAGE_SIZE,
      currentUserId: session?.user?.id,
    });
  }

  // Ensure we only pass plain JSON-serializable data to the client
  const initialResponseSerializable = JSON.parse(JSON.stringify(initialResponse));
  const filteredCardSerializable = filteredCard
    ? JSON.parse(JSON.stringify(filteredCard))
    : undefined;

  return (
    <PublicDecksClient
      initialResponse={initialResponseSerializable}
      cardId={cardId}
      filteredCard={filteredCardSerializable}
      isAuthenticated={Boolean(session?.user?.id)}
    />
  );
}
