"use client";

import { Card, BASIC_ELEMENTS } from "@/app/lib/types/card";
import { DeckCard } from "@/app/lib/types/user";
import { useMemo } from "react";
import { ElementType, ELEMENTS } from "@/app/lib/utils/elements";
import ElementIcon from "./ElementIcon";

interface DeckStatsProps {
  cards: Card[];
  deckCards: DeckCard[];
}

export default function DeckStats({ cards, deckCards }: DeckStatsProps) {
  // Calculate statistics
  const stats = useMemo(() => {
    // Map deck cards to actual cards with quantities
    const deckCardsWithDetails = deckCards
      .map((deckCard) => {
        const card = cards.find((c) => c.id === deckCard.cardId);
        return card ? { card, quantity: deckCard.quantity } : null;
      })
      .filter(
        (item): item is { card: Card; quantity: number } => item !== null
      );

    // Total cards
    const totalCards = deckCards.reduce((sum, card) => sum + card.quantity, 0);

    // Mana curve
    const manaCurve: Record<number, number> = {};
    deckCardsWithDetails.forEach(({ card, quantity }) => {
      const cost = card.manaCost;
      manaCurve[cost] = (manaCurve[cost] || 0) + quantity;
    });

    // Element distribution
    const elementDistribution: Record<string, number> = {};
    deckCardsWithDetails.forEach(({ card, quantity }) => {
      const element = card.element.type;
      elementDistribution[element] =
        (elementDistribution[element] || 0) + quantity;
    });

    // Card type distribution
    const typeDistribution: Record<string, number> = {};
    deckCardsWithDetails.forEach(({ card, quantity }) => {
      const type = card.typeAndAttributes.mainType;
      typeDistribution[type] = (typeDistribution[type] || 0) + quantity;
    });

    // Attribute distribution
    const attributeDistribution: Record<string, number> = {};
    deckCardsWithDetails.forEach(({ card, quantity }) => {
      card.typeAndAttributes.attributes.forEach((attribute) => {
        attributeDistribution[attribute] =
          (attributeDistribution[attribute] || 0) + quantity;
      });
    });

    return {
      totalCards,
      manaCurve,
      elementDistribution,
      typeDistribution,
      attributeDistribution,
    };
  }, [cards, deckCards]);

  // Get max value for mana curve to scale the bars
  const maxManaCurveValue = Math.max(...Object.values(stats.manaCurve), 1);

  return (
    <div className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-4'>
      <h3 className='text-lg font-semibold text-white mb-4'>Deck Statistics</h3>

      {stats.totalCards === 0 ? (
        <div className='text-center py-4 text-gray-400'>
          <p>Add cards to see deck statistics.</p>
        </div>
      ) : (
        <div className='space-y-6'>
          {/* Mana Curve */}
          <div>
            <h4 className='text-sm font-medium text-algomancy-gold mb-2'>
              Mana Curve
            </h4>
            <div className='flex items-end h-32 space-x-1'>
              {Array.from({ length: 10 }, (_, i) => i).map((cost) => (
                <div key={cost} className='flex flex-col items-center flex-1'>
                  <div className='w-full flex flex-col justify-end h-24'>
                    {stats.manaCurve[cost] > 0 && (
                      <div
                        className='bg-algomancy-purple w-full rounded-t'
                        style={{
                          height: `${Math.max(
                            ((stats.manaCurve[cost] || 0) / maxManaCurveValue) *
                              100,
                            5
                          )}%`,
                        }}></div>
                    )}
                  </div>
                  <div className='text-xs text-gray-400 mt-1'>{cost}</div>
                  <div className='text-xs text-white'>
                    {stats.manaCurve[cost] || 0}
                  </div>
                </div>
              ))}
              <div className='flex flex-col items-center flex-1'>
                <div className='w-full flex flex-col justify-end h-24'>
                  {Object.entries(stats.manaCurve)
                    .filter(([cost]) => parseInt(cost) >= 10)
                    .reduce((sum, [_, count]) => sum + count, 0) > 0 && (
                    <div
                      className='bg-algomancy-purple w-full rounded-t'
                      style={{
                        height: `${Math.max(
                          (Object.entries(stats.manaCurve)
                            .filter(([cost]) => parseInt(cost) >= 10)
                            .reduce((sum, [_, count]) => sum + count, 0) /
                            maxManaCurveValue) *
                            100,
                          5
                        )}%`,
                      }}></div>
                  )}
                </div>
                <div className='text-xs text-gray-400 mt-1'>10+</div>
                <div className='text-xs text-white'>
                  {Object.entries(stats.manaCurve)
                    .filter(([cost]) => parseInt(cost) >= 10)
                    .reduce((sum, [_, count]) => sum + count, 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Element Distribution */}
          <div>
            <h4 className='text-sm font-medium text-algomancy-gold mb-2'>
              Element Distribution
            </h4>
            <div className='grid grid-cols-2 gap-2'>
              {Object.entries(stats.elementDistribution)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([element, count]) => {
                  // Handle hybrid elements for display
                  let elementNames: ElementType[] = [];
                  if (element.includes("/")) {
                    elementNames = element.split("/") as ElementType[];
                  } else {
                    elementNames = [element as ElementType];
                  }

                  return (
                    <div
                      key={element}
                      className='flex justify-between items-center py-1 px-2 rounded-md'
                      style={{
                        background:
                          elementNames.length === 1
                            ? `${ELEMENTS[elementNames[0]].color}20` // 20 is hex for 12% opacity
                            : `linear-gradient(to right, ${elementNames
                                .map((e) => `${ELEMENTS[e].color}20`)
                                .join(", ")})`,
                      }}>
                      <div className='flex items-center'>
                        {elementNames.map((elemName, idx) => (
                          <ElementIcon
                            key={idx}
                            element={elemName}
                            size={18}
                            className={idx > 0 ? "ml-1" : ""}
                          />
                        ))}
                        <span className='text-sm font-medium text-white ml-2'>
                          {element}
                        </span>
                      </div>
                      <span className='text-sm font-medium text-white/80'>
                        {count}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Card Type Distribution */}
          <div>
            <h4 className='text-sm font-medium text-algomancy-gold mb-2'>
              Card Type Distribution
            </h4>
            <div className='grid grid-cols-2 gap-2'>
              {Object.entries(stats.typeDistribution)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([type, count]) => (
                  <div key={type} className='flex justify-between items-center'>
                    <span className='text-sm text-white'>{type}</span>
                    <span className='text-sm text-gray-400'>{count}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Top Attributes */}
          {Object.keys(stats.attributeDistribution).length > 0 && (
            <div>
              <h4 className='text-sm font-medium text-algomancy-gold mb-2'>
                Top Attributes
              </h4>
              <div className='grid grid-cols-2 gap-2'>
                {Object.entries(stats.attributeDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([attribute, count]) => (
                    <div
                      key={attribute}
                      className='flex justify-between items-center'>
                      <span className='text-sm text-white'>{attribute}</span>
                      <span className='text-sm text-gray-400'>{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
