"use client";

import { Card, BASIC_ELEMENTS } from "@/app/lib/types/card";
import { DeckCard } from "@/app/lib/types/user";
import { useMemo } from "react";
import { ElementType, ELEMENTS } from "@/app/lib/utils/elements";
import ElementIcon from "./ElementIcon";

interface ColorBarProps {
  elementCounts: Record<string, number>;
  maxValue: number;
  totalCards: number;
}

function ColorBar({ elementCounts, maxValue, totalCards }: ColorBarProps) {
  // Calculate the height percentage based on the max value
  const heightPercent = Math.max((totalCards / maxValue) * 100, 5);

  // Sort elements by count for consistent rendering
  const sortedElements = Object.entries(elementCounts).sort(
    ([, countA], [, countB]) => countB - countA
  );

  return (
    <div
      className='w-full flex flex-col-reverse rounded-t overflow-hidden'
      style={{ height: `${heightPercent}%` }}>
      {sortedElements.map(([element, count]) => {
        // Calculate the height percentage for this element
        const elementPercent = (count / totalCards) * 100;

        // Get element color - handle hybrid elements
        let elementColor;
        if (element.includes("/")) {
          // For hybrid elements, use a gradient
          const [primary, secondary] = element.split("/") as [
            ElementType,
            ElementType
          ];
          elementColor = `linear-gradient(to right, ${ELEMENTS[primary].color}, ${ELEMENTS[secondary].color})`;
        } else {
          // For basic elements, use the solid color
          elementColor =
            ELEMENTS[element as ElementType]?.color ||
            ELEMENTS["Colorless"].color;
        }

        return (
          <div
            key={element}
            style={{
              height: `${elementPercent}%`,
              background: elementColor,
              width: "100%",
              minHeight: "4px", // Ensure even small segments are visible
              transition: "all 0.2s ease",
            }}
            className='hover:brightness-125 hover:z-10'
            title={`${element}: ${count} cards`}
          />
        );
      })}
    </div>
  );
}

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
    // Track element distribution per mana cost
    const manaCurveByElement: Record<number, Record<string, number>> = {};

    deckCardsWithDetails.forEach(({ card, quantity }) => {
      // For X-cost spells, we'll put them in a special "X" category (using -1 as the key)
      const isXCostSpell =
        card.manaCost === 0 &&
        card.typeAndAttributes.mainType === "Spell" &&
        !card.typeAndAttributes.subType.toLowerCase().includes("token");

      // Use -1 as the key for X-cost spells, otherwise use the actual mana cost
      const cost = isXCostSpell ? -1 : card.manaCost;
      const element = card.element.type;

      // Update total count for this mana cost
      manaCurve[cost] = (manaCurve[cost] || 0) + quantity;

      // Initialize mana cost entry if it doesn't exist
      if (!manaCurveByElement[cost]) {
        manaCurveByElement[cost] = {};
      }

      // Add card quantity to the element count for this mana cost
      manaCurveByElement[cost][element] =
        (manaCurveByElement[cost][element] || 0) + quantity;
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
      manaCurveByElement,
      elementDistribution,
      typeDistribution,
      attributeDistribution,
    };
  }, [cards, deckCards]);

  // Get max value for mana curve to scale the bars
  const maxManaCurveValue = Math.max(...Object.values(stats.manaCurve), 1);

  return (
    <div className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-6'>
      <h3 className='text-lg font-semibold text-white mb-4'>Deck Statistics</h3>

      {stats.totalCards === 0 ? (
        <div className='text-center py-4 text-gray-400'>
          <p>Add cards to see deck statistics.</p>
        </div>
      ) : (
        <div className='space-y-10'>
          {/* Mana Curve */}
          <div>
            <h4 className='text-sm font-medium text-algomancy-gold mb-4'>
              Mana Curve
            </h4>
            <div className='flex items-end h-32 space-x-2 mb-4'>
              {/* X cost column */}
              {stats.manaCurve[-1] > 0 && (
                <div className='flex flex-col items-center flex-1'>
                  <div className='w-full flex flex-col justify-end h-24'>
                    <ColorBar
                      elementCounts={stats.manaCurveByElement[-1] || {}}
                      maxValue={maxManaCurveValue}
                      totalCards={stats.manaCurve[-1]}
                    />
                  </div>
                  <div className='text-xs text-gray-400 mt-1'>X</div>
                  <div className='text-xs text-white'>
                    {stats.manaCurve[-1] || 0}
                  </div>
                </div>
              )}

              {/* Regular mana costs 0-9 */}
              {Array.from({ length: 10 }, (_, i) => i).map((cost) => (
                <div key={cost} className='flex flex-col items-center flex-1'>
                  <div className='w-full flex flex-col justify-end h-24'>
                    {stats.manaCurve[cost] > 0 && (
                      <ColorBar
                        elementCounts={stats.manaCurveByElement[cost] || {}}
                        maxValue={maxManaCurveValue}
                        totalCards={stats.manaCurve[cost]}
                      />
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
                    <ColorBar
                      elementCounts={Object.entries(stats.manaCurveByElement)
                        .filter(([cost]) => parseInt(cost) >= 10)
                        .reduce((acc, [cost, elements]) => {
                          // Combine all elements for costs >= 10
                          Object.entries(elements).forEach(
                            ([element, count]) => {
                              acc[element] = (acc[element] || 0) + count;
                            }
                          );
                          return acc;
                        }, {} as Record<string, number>)}
                      maxValue={maxManaCurveValue}
                      totalCards={Object.entries(stats.manaCurve)
                        .filter(([cost]) => parseInt(cost) >= 10)
                        .reduce((sum, [_, count]) => sum + count, 0)}
                    />
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

            {/* Element Legend */}
            <div className='flex flex-wrap gap-2 mt-3 justify-center'>
              {Object.entries(BASIC_ELEMENTS).map(([key, element]) => (
                <div key={key} className='flex items-center'>
                  <div
                    className='w-3 h-3 rounded-full mr-1'
                    style={{
                      backgroundColor: ELEMENTS[element as ElementType].color,
                    }}
                  />
                  <span className='text-xs text-gray-400'>{element}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Element Distribution */}
          <div>
            <h4 className='text-sm font-medium text-algomancy-gold mb-4'>
              Element Distribution
            </h4>
            <div className='grid grid-cols-2 gap-3'>
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
            <h4 className='text-sm font-medium text-algomancy-gold mb-4'>
              Card Type Distribution
            </h4>
            <div className='grid grid-cols-2 gap-3'>
              {Object.entries(stats.typeDistribution)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([type, count]) => (
                  <div
                    key={type}
                    className='flex justify-between items-center py-1'>
                    <span className='text-sm text-white'>{type}</span>
                    <span className='text-sm text-gray-400'>{count}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Top Attributes */}
          {Object.keys(stats.attributeDistribution).length > 0 && (
            <div>
              <h4 className='text-sm font-medium text-algomancy-gold mb-4'>
                Top Attributes
              </h4>
              <div className='grid grid-cols-2 gap-3'>
                {Object.entries(stats.attributeDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([attribute, count]) => (
                    <div
                      key={attribute}
                      className='flex justify-between items-center py-1'>
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
