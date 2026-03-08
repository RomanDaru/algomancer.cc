export interface GameLogDraftOpponent {
  id: string;
  name: string;
  elements: string[];
  externalDeckUrl: string;
  mvpCardIds: string[];
}

export interface GameLogDraft {
  title: string;
  playedAt: string;
  durationMinutes: string;
  outcome: string;
  matchType: string;
  matchTypeLabel: string;
  format: string;
  isPublic: boolean;
  deckId: string;
  externalDeckUrl: string;
  teammateDeckId: string;
  teammateExternalDeckUrl: string;
  elementsPlayed: string[];
  mvpCardIds: string[];
  notes: string;
  opponents: GameLogDraftOpponent[];
}

export function loadGameLogDraft(key: string): GameLogDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as GameLogDraft;
  } catch (error) {
    console.error("Failed to load game log draft:", error);
    clearGameLogDraft(key);
    return null;
  }
}

export function saveGameLogDraft(key: string, draft: GameLogDraft): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    sessionStorage.setItem(key, JSON.stringify(draft));
  } catch (error) {
    console.error("Failed to save game log draft:", error);
  }
}

export function clearGameLogDraft(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to clear game log draft:", error);
  }
}
