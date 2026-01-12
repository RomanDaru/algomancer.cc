import { ObjectId } from "mongodb";
import type { GameLog } from "../types/gameLog";
import { BASIC_ELEMENTS } from "../types/card";
import type { ValidationResult } from "./competitionValidation";
import { isValidAlgomancerDeckUrl } from "./deckUrl";

const OUTCOMES = ["win", "loss", "draw"] as const;
const FORMATS = ["constructed", "live_draft"] as const;
const MATCH_TYPES = ["1v1", "2v2", "ffa", "custom"] as const;
const BASIC_ELEMENT_VALUES = Object.values(BASIC_ELEMENTS);
const TITLE_MIN = 3;
const TITLE_MAX = 80;
const MATCH_TYPE_LABEL_MIN = 2;
const MATCH_TYPE_LABEL_MAX = 40;
const NOTES_MAX = 1000;
const DURATION_MAX = 1440;

const isValidUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export function validateGameLogData(
  data: Partial<GameLog>,
  options?: { requireAll?: boolean }
): ValidationResult {
  const errors: string[] = [];
  const fieldErrors: Record<string, string[]> = {};
  const requireAll = options?.requireAll ?? false;

  const addFieldError = (field: string, error: string) => {
    errors.push(error);
    if (!fieldErrors[field]) fieldErrors[field] = [];
    fieldErrors[field].push(error);
  };

  if (requireAll || data.title !== undefined) {
    if (typeof data.title !== "string") {
      addFieldError("title", "title must be a string");
    } else {
      const trimmedTitle = data.title.trim();
      if (trimmedTitle.length < TITLE_MIN) {
        addFieldError("title", "title must be at least 3 characters");
      } else if (trimmedTitle.length > TITLE_MAX) {
        addFieldError("title", "title must be 80 characters or less");
      }
    }
  }

  if (requireAll || data.playedAt) {
    const playedAt = data.playedAt ? new Date(data.playedAt) : null;
    if (!playedAt || Number.isNaN(playedAt.getTime())) {
      addFieldError("playedAt", "playedAt must be a valid date");
    }
  }

  if (requireAll || data.durationMinutes !== undefined) {
    const duration = Number(data.durationMinutes);
    if (Number.isNaN(duration) || duration < 0) {
      addFieldError("durationMinutes", "durationMinutes must be 0 or greater");
    } else if (duration > DURATION_MAX) {
      addFieldError(
        "durationMinutes",
        "durationMinutes must be 1440 or less"
      );
    }
  }

  if (requireAll || data.outcome) {
    if (!data.outcome || !OUTCOMES.includes(data.outcome)) {
      addFieldError("outcome", "outcome must be win, loss, or draw");
    }
  }

  if (requireAll || data.format) {
    if (!data.format || !FORMATS.includes(data.format)) {
      addFieldError("format", "format must be constructed or live_draft");
    }
  }

  if (requireAll || data.matchType) {
    if (!data.matchType || !MATCH_TYPES.includes(data.matchType)) {
      addFieldError("matchType", "matchType must be 1v1, 2v2, ffa, or custom");
    }
  }

  if (data.matchTypeLabel !== undefined) {
    if (typeof data.matchTypeLabel !== "string") {
      addFieldError("matchTypeLabel", "matchTypeLabel must be a string");
    } else {
      const trimmedLabel = data.matchTypeLabel.trim();
      if (trimmedLabel.length > 0 && trimmedLabel.length < MATCH_TYPE_LABEL_MIN) {
        addFieldError("matchTypeLabel", "matchTypeLabel is too short");
      } else if (trimmedLabel.length > MATCH_TYPE_LABEL_MAX) {
        addFieldError("matchTypeLabel", "matchTypeLabel is too long");
      }
    }
  }

  if (data.matchType === "custom") {
    if (!data.matchTypeLabel?.trim()) {
      addFieldError("matchTypeLabel", "matchTypeLabel is required for custom");
    }
  }

  if (data.isPublic !== undefined && typeof data.isPublic !== "boolean") {
    addFieldError("isPublic", "isPublic must be a boolean");
  }

  if (data.notes !== undefined) {
    if (typeof data.notes !== "string") {
      addFieldError("notes", "notes must be a string");
    } else if (data.notes.trim().length > NOTES_MAX) {
      addFieldError("notes", "notes must be 1000 characters or less");
    }
  }

  if (data.opponents !== undefined) {
    if (!Array.isArray(data.opponents)) {
      addFieldError("opponents", "opponents must be an array");
    } else {
      data.opponents.forEach((opponent, index) => {
        const nameValue =
          typeof opponent?.name === "string" ? opponent.name.trim() : "";
        const elementsCount = Array.isArray(opponent?.elements)
          ? opponent.elements.length
          : 0;
        const externalValue =
          typeof opponent?.externalDeckUrl === "string"
            ? opponent.externalDeckUrl.trim()
            : "";
        const mvpCount = Array.isArray(opponent?.mvpCardIds)
          ? opponent.mvpCardIds.length
          : 0;
        const hasDetails = elementsCount > 0 || externalValue.length > 0 || mvpCount > 0;

        if (!nameValue && hasDetails) {
          addFieldError(`opponents.${index}.name`, "opponent name is required");
        } else if (nameValue.length > 0 && nameValue.length < 2) {
          addFieldError(`opponents.${index}.name`, "opponent name is too short");
        } else if (nameValue.length > 40) {
          addFieldError(`opponents.${index}.name`, "opponent name is too long");
        }

        if (opponent?.name !== undefined && typeof opponent.name !== "string") {
          addFieldError(`opponents.${index}.name`, "opponent name must be a string");
        }
        if (opponent?.userId && typeof opponent.userId === "string") {
          if (!ObjectId.isValid(opponent.userId)) {
            addFieldError(
              `opponents.${index}.userId`,
              "opponent userId is invalid"
            );
          }
        }
        if (opponent?.elements) {
          if (!Array.isArray(opponent.elements)) {
            addFieldError(
              `opponents.${index}.elements`,
              "opponent elements must be an array"
            );
          } else {
            opponent.elements.forEach((element, elementIndex) => {
              if (!BASIC_ELEMENT_VALUES.includes(element)) {
                addFieldError(
                  `opponents.${index}.elements.${elementIndex}`,
                  "opponent element is invalid"
                );
              }
            });
          }
        }

        if (
          opponent?.externalDeckUrl !== undefined &&
          typeof opponent.externalDeckUrl !== "string"
        ) {
          addFieldError(
            `opponents.${index}.externalDeckUrl`,
            "opponent externalDeckUrl must be a string"
          );
        } else if (externalValue && !isValidUrl(externalValue)) {
          addFieldError(
            `opponents.${index}.externalDeckUrl`,
            "opponent externalDeckUrl is invalid"
          );
        } else if (externalValue && !isValidAlgomancerDeckUrl(externalValue)) {
          addFieldError(
            `opponents.${index}.externalDeckUrl`,
            "opponent externalDeckUrl must be an Algomancer deck link"
          );
        }

        if (opponent?.mvpCardIds) {
          if (!Array.isArray(opponent.mvpCardIds)) {
            addFieldError(
              `opponents.${index}.mvpCardIds`,
              "opponent mvpCardIds must be an array"
            );
          } else {
            const unique = new Set<string>();
            opponent.mvpCardIds.forEach((cardId, cardIndex) => {
              if (typeof cardId !== "string" || !cardId.trim()) {
                addFieldError(
                  `opponents.${index}.mvpCardIds.${cardIndex}`,
                  "opponent mvpCardIds must be card id strings"
                );
              } else {
                unique.add(cardId);
              }
            });
            if (unique.size > 3) {
              addFieldError(
                `opponents.${index}.mvpCardIds`,
                "opponent mvpCardIds max is 3"
              );
            }
          }
        }
      });
    }
  }

  if (data.format === "constructed" || data.constructed) {
    if (!data.constructed) {
      addFieldError("constructed", "constructed data is required");
    } else {
      const hasDeck = data.constructed.deckId || data.constructed.externalDeckUrl;
      if (!hasDeck) {
        addFieldError(
          "constructed",
          "constructed requires deckId or externalDeckUrl"
        );
      }
      if (data.constructed.deckId && data.constructed.externalDeckUrl) {
        addFieldError(
          "constructed",
          "constructed requires only one of deckId or externalDeckUrl"
        );
      }
      if (data.constructed.deckId && typeof data.constructed.deckId === "string") {
        if (!ObjectId.isValid(data.constructed.deckId)) {
          addFieldError("constructed.deckId", "deckId is invalid");
        }
      }
      if (
        data.constructed.externalDeckUrl !== undefined &&
        typeof data.constructed.externalDeckUrl !== "string"
      ) {
        addFieldError(
          "constructed.externalDeckUrl",
          "externalDeckUrl must be a string"
        );
      } else if (
        typeof data.constructed.externalDeckUrl === "string" &&
        data.constructed.externalDeckUrl.trim() &&
        !isValidUrl(data.constructed.externalDeckUrl.trim())
      ) {
        addFieldError(
          "constructed.externalDeckUrl",
          "externalDeckUrl is invalid"
        );
      } else if (
        typeof data.constructed.externalDeckUrl === "string" &&
        data.constructed.externalDeckUrl.trim() &&
        !isValidAlgomancerDeckUrl(data.constructed.externalDeckUrl.trim())
      ) {
        addFieldError(
          "constructed.externalDeckUrl",
          "externalDeckUrl must be an Algomancer deck link"
        );
      }
      if (
        data.constructed.teammateDeckId &&
        typeof data.constructed.teammateDeckId === "string"
      ) {
        if (!ObjectId.isValid(data.constructed.teammateDeckId)) {
          addFieldError("constructed.teammateDeckId", "teammateDeckId is invalid");
        }
      }
      if (
        data.constructed.teammateExternalDeckUrl !== undefined &&
        typeof data.constructed.teammateExternalDeckUrl !== "string"
      ) {
        addFieldError(
          "constructed.teammateExternalDeckUrl",
          "teammateExternalDeckUrl must be a string"
        );
      } else if (
        typeof data.constructed.teammateExternalDeckUrl === "string" &&
        data.constructed.teammateExternalDeckUrl.trim() &&
        !isValidUrl(data.constructed.teammateExternalDeckUrl.trim())
      ) {
        addFieldError(
          "constructed.teammateExternalDeckUrl",
          "teammateExternalDeckUrl is invalid"
        );
      } else if (
        typeof data.constructed.teammateExternalDeckUrl === "string" &&
        data.constructed.teammateExternalDeckUrl.trim() &&
        !isValidAlgomancerDeckUrl(data.constructed.teammateExternalDeckUrl.trim())
      ) {
        addFieldError(
          "constructed.teammateExternalDeckUrl",
          "teammateExternalDeckUrl must be an Algomancer deck link"
        );
      }
    }
  }

  if (data.format === "live_draft" || data.liveDraft) {
    if (!data.liveDraft) {
      addFieldError("liveDraft", "liveDraft data is required");
    } else {
      if (!Array.isArray(data.liveDraft.elementsPlayed)) {
        addFieldError("liveDraft.elementsPlayed", "elementsPlayed is required");
      } else {
        if (data.liveDraft.elementsPlayed.length === 0) {
          addFieldError("liveDraft.elementsPlayed", "elementsPlayed cannot be empty");
        }
        if (data.liveDraft.elementsPlayed.length > BASIC_ELEMENT_VALUES.length) {
          addFieldError(
            "liveDraft.elementsPlayed",
            "elementsPlayed has too many entries"
          );
        }
        data.liveDraft.elementsPlayed.forEach((element, index) => {
          if (!BASIC_ELEMENT_VALUES.includes(element)) {
            addFieldError(
              `liveDraft.elementsPlayed.${index}`,
              "elementsPlayed has invalid element"
            );
          }
        });
      }

      if (data.liveDraft.mvpCardIds) {
        if (!Array.isArray(data.liveDraft.mvpCardIds)) {
          addFieldError("liveDraft.mvpCardIds", "mvpCardIds must be an array");
        } else {
          const unique = new Set<string>();
          data.liveDraft.mvpCardIds.forEach((cardId, index) => {
            if (typeof cardId !== "string" || !cardId.trim()) {
              addFieldError(
                `liveDraft.mvpCardIds.${index}`,
                "mvpCardIds must be card id strings"
              );
            } else {
              unique.add(cardId);
            }
          });
          if (unique.size > 3) {
            addFieldError("liveDraft.mvpCardIds", "mvpCardIds max is 3");
          }
        }
      }
    }
  }

  if (data.format && data.constructed && data.format !== "constructed") {
    addFieldError("constructed", "constructed is only valid for constructed format");
  }

  if (data.format && data.liveDraft && data.format !== "live_draft") {
    addFieldError("liveDraft", "liveDraft is only valid for live_draft format");
  }

  return {
    isValid: errors.length === 0,
    errors,
    fieldErrors,
  };
}
