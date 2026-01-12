import { ObjectId } from "mongodb";
import type { GameLog } from "../types/gameLog";

export function normalizeGameLogPayload(input: any): Partial<GameLog> {
  const normalized: Partial<GameLog> = {};

  if (typeof input.title === "string") {
    normalized.title = input.title.trim() || "Untitled Game";
  }

  if (input.playedAt) {
    normalized.playedAt = new Date(input.playedAt);
  }

  if (input.durationMinutes !== undefined) {
    normalized.durationMinutes = Number(input.durationMinutes);
  }

  if (input.outcome) {
    normalized.outcome = input.outcome;
  }

  if (input.format) {
    normalized.format = input.format;
  }

  if (input.matchType) {
    normalized.matchType = input.matchType;
  }

  if (typeof input.matchTypeLabel === "string") {
    normalized.matchTypeLabel = input.matchTypeLabel.trim();
  }

  if (typeof input.isPublic === "boolean") {
    normalized.isPublic = input.isPublic;
  }

  if (typeof input.notes === "string") {
    normalized.notes = input.notes.trim();
  }

  if (Array.isArray(input.opponents)) {
    normalized.opponents = input.opponents
      .map((opponent: any) => {
        if (!opponent) return null;
        const normalizedOpponent: any = {
          name: typeof opponent.name === "string" ? opponent.name.trim() : "",
        };

        if (typeof opponent.userId === "string" && ObjectId.isValid(opponent.userId)) {
          normalizedOpponent.userId = new ObjectId(opponent.userId);
        } else if (opponent.userId instanceof ObjectId) {
          normalizedOpponent.userId = opponent.userId;
        }

        if (Array.isArray(opponent.elements)) {
          normalizedOpponent.elements = opponent.elements;
        }

        if (typeof opponent.externalDeckUrl === "string") {
          normalizedOpponent.externalDeckUrl = opponent.externalDeckUrl.trim();
        }

        if (Array.isArray(opponent.mvpCardIds)) {
          const uniqueIds = Array.from(
            new Set(
              opponent.mvpCardIds
                .filter((value: any) => typeof value === "string")
                .map((value: string) => value.trim())
                .filter(Boolean)
            )
          );
          normalizedOpponent.mvpCardIds = uniqueIds;
        }

        return normalizedOpponent;
      })
      .filter(Boolean);
  }

  if (input.constructed) {
    const constructed: any = {};

    if (typeof input.constructed.deckId === "string" && ObjectId.isValid(input.constructed.deckId)) {
      constructed.deckId = new ObjectId(input.constructed.deckId);
    } else if (input.constructed.deckId instanceof ObjectId) {
      constructed.deckId = input.constructed.deckId;
    }

    if (typeof input.constructed.externalDeckUrl === "string") {
      constructed.externalDeckUrl = input.constructed.externalDeckUrl.trim();
    }

    if (
      typeof input.constructed.teammateDeckId === "string" &&
      ObjectId.isValid(input.constructed.teammateDeckId)
    ) {
      constructed.teammateDeckId = new ObjectId(input.constructed.teammateDeckId);
    } else if (input.constructed.teammateDeckId instanceof ObjectId) {
      constructed.teammateDeckId = input.constructed.teammateDeckId;
    }

    if (typeof input.constructed.teammateExternalDeckUrl === "string") {
      constructed.teammateExternalDeckUrl =
        input.constructed.teammateExternalDeckUrl.trim();
    }

    normalized.constructed = constructed;
  }

  if (input.liveDraft) {
    const liveDraft: any = {};

    if (Array.isArray(input.liveDraft.elementsPlayed)) {
      liveDraft.elementsPlayed = input.liveDraft.elementsPlayed;
    }

    if (Array.isArray(input.liveDraft.mvpCardIds)) {
      const uniqueIds = Array.from(
        new Set(
          input.liveDraft.mvpCardIds
            .filter((value: any) => typeof value === "string")
            .map((value: string) => value.trim())
            .filter(Boolean)
        )
      );
      liveDraft.mvpCardIds = uniqueIds;
    }

    normalized.liveDraft = liveDraft;
  }

  return normalized;
}
