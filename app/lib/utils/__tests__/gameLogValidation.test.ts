import { validateGameLogData } from "../gameLogValidation";

const validDeckId = "507f1f77bcf86cd799439011";

const baseLog = {
  title: "Test Log",
  playedAt: new Date().toISOString(),
  durationMinutes: 30,
  outcome: "win",
  format: "constructed",
  matchType: "1v1",
  isPublic: false,
  opponents: [],
  constructed: {
    deckId: validDeckId,
  },
};

describe("validateGameLogData", () => {
  test("accepts valid constructed log", () => {
    const result = validateGameLogData(baseLog, { requireAll: true });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("requires custom match label when matchType is custom", () => {
    const result = validateGameLogData(
      { ...baseLog, matchType: "custom", matchTypeLabel: "" },
      { requireAll: true }
    );
    expect(result.isValid).toBe(false);
    expect(result.fieldErrors.matchTypeLabel?.length).toBeGreaterThan(0);
  });

  test("rejects opponent details without a name", () => {
    const result = validateGameLogData(
      {
        ...baseLog,
        opponents: [{ name: "", elements: ["Fire"] }],
      },
      { requireAll: true }
    );
    expect(result.isValid).toBe(false);
    expect(result.fieldErrors["opponents.0.name"]?.length).toBeGreaterThan(0);
  });

  test("allows empty opponent rows", () => {
    const result = validateGameLogData(
      {
        ...baseLog,
        opponents: [{ name: "", elements: [] }],
      },
      { requireAll: true }
    );
    expect(result.isValid).toBe(true);
  });

  test("rejects constructed with both deckId and externalDeckUrl", () => {
    const result = validateGameLogData(
      {
        ...baseLog,
        constructed: {
          deckId: validDeckId,
          externalDeckUrl: `https://algomancer.cc/decks/${validDeckId}`,
        },
      },
      { requireAll: true }
    );
    expect(result.isValid).toBe(false);
    expect(result.fieldErrors.constructed?.length).toBeGreaterThan(0);
  });

  test("rejects non-algomancer external deck url", () => {
    const result = validateGameLogData(
      {
        ...baseLog,
        constructed: {
          deckId: undefined,
          externalDeckUrl: "https://example.com/decks/507f1f77bcf86cd799439011",
        },
      },
      { requireAll: true }
    );
    expect(result.isValid).toBe(false);
    expect(result.fieldErrors["constructed.externalDeckUrl"]?.length).toBeGreaterThan(0);
  });

  test("requires live draft elements", () => {
    const result = validateGameLogData(
      {
        ...baseLog,
        format: "live_draft",
        constructed: undefined,
        liveDraft: { elementsPlayed: [] },
      },
      { requireAll: true }
    );
    expect(result.isValid).toBe(false);
    expect(result.fieldErrors["liveDraft.elementsPlayed"]?.length).toBeGreaterThan(
      0
    );
  });

  test("rejects overly long duration", () => {
    const result = validateGameLogData(
      { ...baseLog, durationMinutes: 1500 },
      { requireAll: true }
    );
    expect(result.isValid).toBe(false);
    expect(result.fieldErrors.durationMinutes?.length).toBeGreaterThan(0);
  });

  test("requires format when constructed payload is provided in patch", () => {
    const result = validateGameLogData(
      { constructed: { deckId: validDeckId } },
      { requireAll: false }
    );
    expect(result.isValid).toBe(false);
    expect(result.fieldErrors.format?.length).toBeGreaterThan(0);
  });

  test("rejects payload containing both constructed and liveDraft", () => {
    const result = validateGameLogData(
      {
        ...baseLog,
        format: "constructed",
        liveDraft: { elementsPlayed: ["Fire"] },
      },
      { requireAll: true }
    );
    expect(result.isValid).toBe(false);
    expect(result.fieldErrors.format?.length).toBeGreaterThan(0);
  });
});
