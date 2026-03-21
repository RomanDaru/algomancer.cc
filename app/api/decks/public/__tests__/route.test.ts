import { deckService } from "@/app/lib/services/deckService";
import { getServerSession } from "next-auth/next";
import { PUBLIC_DECKS_MAX_PAGE_SIZE } from "@/app/lib/constants";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/app/api/auth/[...nextauth]/route", () => ({
  authOptions: {},
}));

jest.mock("@/app/lib/services/deckService", () => ({
  deckService: {
    getPublicDecksPage: jest.fn(),
    getPublicDecksWithUserInfo: jest.fn(),
  },
}));

let GET: typeof import("../route").GET;

describe("GET /api/decks/public", () => {
  const originalWarn = console.warn;

  beforeAll(async () => {
    ({ GET } = await import("../route"));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    console.warn = jest.fn();
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user-123" },
    });
  });

  afterAll(() => {
    console.warn = originalWarn;
  });

  it("passes cursor filters and limit guardrails to the paginated service", async () => {
    (deckService.getPublicDecksPage as jest.Mock).mockResolvedValue({
      decks: [],
      total: 0,
      hasMore: false,
      nextCursor: null,
      effectiveLimit: PUBLIC_DECKS_MAX_PAGE_SIZE,
      requestedLimit: 999,
      warnings: ["limit_capped_to_max"],
    });

    const response = await GET({
      url: "http://localhost/api/decks/public?withMeta=1&sort=liked&q=dragon&elements=Fire,Water&badges=Aggro,Control&limit=999&cursor=abc123",
    } as Request);
    const payload = await response.json();

    expect(deckService.getPublicDecksPage).toHaveBeenCalledWith({
      sortBy: "liked",
      limit: PUBLIC_DECKS_MAX_PAGE_SIZE,
      cursor: "abc123",
      currentUserId: "user-123",
      filters: {
        searchQuery: "dragon",
        elements: ["Fire", "Water"],
        badges: ["Aggro", "Control"],
      },
      requestedLimit: 999,
      warnings: ["limit_capped_to_max"],
    });
    expect(payload).toMatchObject({
      warnings: ["limit_capped_to_max"],
    });
    expect(console.warn).toHaveBeenCalledTimes(1);
  });
});
