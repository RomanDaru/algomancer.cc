import {
  Card,
  CardChangeMode,
  CardChangeScope,
} from "../types/card";
import { cardDbService } from "../db/services/cardDbService";
import { deckDbService } from "../db/services/deckDbService";
import {
  buildCardChangeSummary,
  didCardAssetsChange,
  resolveCardChangeScope,
} from "../utils/cardChange";
import { cardService } from "./cardService";

export interface AdminCardUpdateInput {
  card: Card;
  changeMode?: CardChangeMode;
  changeSummary?: string;
}

export interface AdminCardUpdateResult {
  card: Card;
  previousCard: Card | null;
  changeScope: CardChangeScope;
  changeSummary: string;
  flaggedDecksCount: number;
  flaggedPublicDecksCount: number;
}

export const adminCardService = {
  async updateCardWithReview({
    card,
    changeMode = "auto",
    changeSummary,
  }: AdminCardUpdateInput): Promise<AdminCardUpdateResult | null> {
    const previousCard = await cardDbService.getCardById(card.id);

    if (!previousCard) {
      return null;
    }

    const now = new Date();
    const changeScope = resolveCardChangeScope(previousCard, card, changeMode);
    const resolvedSummary = buildCardChangeSummary(
      previousCard,
      card,
      changeScope,
      changeSummary
    );

    const nextCard: Card = {
      ...card,
      rulesVersion:
        changeScope === "rules"
          ? (previousCard.rulesVersion || 1) + 1
          : previousCard.rulesVersion || 1,
      rulesUpdatedAt:
        changeScope === "rules"
          ? now
          : previousCard.rulesUpdatedAt || previousCard.assetUpdatedAt || now,
      assetUpdatedAt:
        changeScope === "asset" ||
        didCardAssetsChange(previousCard, card) ||
        previousCard.imageUrl !== card.imageUrl
          ? now
          : previousCard.assetUpdatedAt ||
            previousCard.rulesUpdatedAt ||
            now,
      lastChangeScope:
        changeScope === "none"
          ? previousCard.lastChangeScope
          : changeScope,
      lastChangeSummary:
        changeScope === "none"
          ? previousCard.lastChangeSummary
          : resolvedSummary,
    };

    const updatedCard = await cardDbService.updateCard(nextCard);
    if (!updatedCard) {
      return null;
    }

    let flaggedDecksCount = 0;
    let flaggedPublicDecksCount = 0;

    if (changeScope === "rules") {
      const result = await deckDbService.flagDecksForCardChange({
        cardId: updatedCard.id,
        cardName: updatedCard.name,
        changeSummary: resolvedSummary,
        rulesVersion: updatedCard.rulesVersion || nextCard.rulesVersion || 1,
        changedAt: updatedCard.rulesUpdatedAt || now,
      });
      flaggedDecksCount = result.totalFlagged;
      flaggedPublicDecksCount = result.publicFlagged;
    }

    cardService.clearCache();

    return {
      card: updatedCard,
      previousCard,
      changeScope,
      changeSummary: resolvedSummary,
      flaggedDecksCount,
      flaggedPublicDecksCount,
    };
  },
};
