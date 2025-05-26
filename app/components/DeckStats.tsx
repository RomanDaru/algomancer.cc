"use client";

import { Card, BASIC_ELEMENTS } from "@/app/lib/types/card";
import { DeckCard } from "@/app/lib/types/user";
import { useMemo } from "react";
import { ElementType, ELEMENTS } from "@/app/lib/utils/elements";
import ElementIcon from "./ElementIcon";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import { AffinityRequirements } from "@/app/lib/utils/affinityUtils";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

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

interface AffinityBarProps {
  affinityRequirements: AffinityRequirements;
  maxValue: number;
}

function AffinityColorBar({
  affinityRequirements,
  maxValue,
}: AffinityBarProps) {
  // Convert affinity requirements to element counts format
  const elementCounts: Record<string, number> = {};

  Object.entries(affinityRequirements).forEach(([element, value]) => {
    if (value > 0) {
      elementCounts[element.charAt(0).toUpperCase() + element.slice(1)] = value;
    }
  });

  if (Object.keys(elementCounts).length === 0) {
    return null;
  }

  // Calculate the height percentage based on the total affinity requirements for this mana cost
  const totalAffinityForThisCost = Object.values(affinityRequirements).reduce(
    (sum, val) => sum + val,
    0
  );
  const heightPercent = Math.max(
    (totalAffinityForThisCost / maxValue) * 100,
    5
  );

  // Sort elements by affinity value (descending) for consistent stacking
  const sortedElements = Object.entries(elementCounts).sort(
    ([, a], [, b]) => b - a
  );

  return (
    <div
      className='w-full flex flex-col-reverse rounded-t overflow-hidden'
      style={{ height: `${heightPercent}%` }}>
      {sortedElements.map(([element, value]) => {
        // Calculate the height percentage for this element within the bar
        // This should be proportional to its value relative to the total affinity for this cost
        const elementPercent = (value / totalAffinityForThisCost) * 100;

        // Get element color
        const elementColor =
          ELEMENTS[element as ElementType]?.color ||
          ELEMENTS["Colorless"].color;

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
            className='hover:opacity-80 hover:z-10 transition-opacity duration-200'
            title={`${element}: ${value} affinity required`}
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

    return {
      totalCards,
      manaCurve,
      manaCurveByElement,
      elementDistribution,
      typeDistribution,
    };
  }, [cards, deckCards]);

  // Calculate affinity curve (peak affinity by mana cost)
  const affinityCurve = useMemo(() => {
    const affinityCurve: Record<
      number,
      {
        fire: number;
        water: number;
        earth: number;
        wood: number;
        metal: number;
      }
    > = {};

    deckCards.forEach((deckCard) => {
      const card = cards.find((c) => c.id === deckCard.cardId);
      if (card && card.stats.affinity) {
        // For X-cost spells, use -1 as the key
        const isXCostSpell =
          card.manaCost === 0 &&
          card.typeAndAttributes.mainType === "Spell" &&
          !card.typeAndAttributes.subType.toLowerCase().includes("token");

        const cost = isXCostSpell ? -1 : card.manaCost;
        const affinity = card.stats.affinity;

        // Initialize mana cost entry if it doesn't exist
        if (!affinityCurve[cost]) {
          affinityCurve[cost] = {
            fire: 0,
            water: 0,
            earth: 0,
            wood: 0,
            metal: 0,
          };
        }

        // Update peak values for this mana cost
        affinityCurve[cost].fire = Math.max(
          affinityCurve[cost].fire,
          affinity.fire || 0
        );
        affinityCurve[cost].water = Math.max(
          affinityCurve[cost].water,
          affinity.water || 0
        );
        affinityCurve[cost].earth = Math.max(
          affinityCurve[cost].earth,
          affinity.earth || 0
        );
        affinityCurve[cost].wood = Math.max(
          affinityCurve[cost].wood,
          affinity.wood || 0
        );
        affinityCurve[cost].metal = Math.max(
          affinityCurve[cost].metal,
          affinity.metal || 0
        );
      }
    });

    return affinityCurve;
  }, [cards, deckCards]);

  // Get max value for mana curve to scale the bars
  const maxManaCurveValue = Math.max(...Object.values(stats.manaCurve), 1);

  // Get max total affinity value for scaling affinity bars
  const maxAffinityValue = useMemo(() => {
    let maxValue = 1;
    Object.values(affinityCurve).forEach((affinity) => {
      const totalAffinity = Object.values(affinity).reduce(
        (sum, val) => sum + val,
        0
      );
      maxValue = Math.max(maxValue, totalAffinity);
    });

    return maxValue;
  }, [affinityCurve]);

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
          </div>

          {/* Affinity Curve */}
          {Object.keys(affinityCurve).length > 0 && (
            <div>
              <h4 className='text-sm font-medium text-algomancy-gold mb-4'>
                Affinity Curve (Peak Requirements)
              </h4>

              {/* Mobile view - Simplified */}
              <div className='sm:hidden mb-4'>
                <div className='grid grid-cols-2 gap-2 text-sm'>
                  {Object.entries(affinityCurve)
                    .sort(([a], [b]) => {
                      const costA = a === "-1" ? -1 : parseInt(a);
                      const costB = b === "-1" ? -1 : parseInt(b);
                      return costA - costB;
                    })
                    .map(([cost, affinity]) => {
                      const totalAffinity = Object.values(affinity).reduce(
                        (sum, val) => sum + val,
                        0
                      );
                      const nonZeroElements = Object.entries(affinity).filter(
                        ([_, val]) => val > 0
                      );

                      return (
                        <div key={cost} className='bg-gray-800 rounded p-2'>
                          <div className='text-gray-400 text-xs mb-1'>
                            {cost === "-1" ? "X" : cost} cost
                          </div>
                          <div className='space-y-1'>
                            {nonZeroElements.map(([element, value]) => {
                              const elementType = (element
                                .charAt(0)
                                .toUpperCase() +
                                element.slice(1)) as ElementType;
                              const elementColor =
                                ELEMENTS[elementType]?.color ||
                                ELEMENTS["Colorless"].color;

                              return (
                                <div
                                  key={element}
                                  className='flex items-center justify-between'>
                                  <div className='flex items-center'>
                                    <div
                                      className='w-3 h-3 rounded-full mr-2'
                                      style={{ backgroundColor: elementColor }}
                                    />
                                    <span className='text-white text-xs capitalize'>
                                      {element}
                                    </span>
                                  </div>
                                  <span className='text-white text-xs font-bold'>
                                    {value}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Desktop affinity curve */}
              <div className='hidden sm:flex items-end h-32 space-x-2 mb-4'>
                {/* X cost column */}
                {affinityCurve[-1] && (
                  <div className='flex flex-col items-center flex-1'>
                    <div className='w-full flex flex-col justify-end h-24'>
                      <AffinityColorBar
                        affinityRequirements={affinityCurve[-1]}
                        maxValue={maxAffinityValue}
                      />
                    </div>
                    <div className='text-xs text-gray-400 mt-1'>X</div>
                    <div className='text-xs text-white'>
                      {Object.values(affinityCurve[-1]).reduce(
                        (sum, val) => sum + val,
                        0
                      )}
                    </div>
                  </div>
                )}

                {/* Regular mana costs 0-9 */}
                {Array.from({ length: 10 }, (_, i) => i).map((cost) => (
                  <div key={cost} className='flex flex-col items-center flex-1'>
                    <div className='w-full flex flex-col justify-end h-24'>
                      {affinityCurve[cost] && (
                        <AffinityColorBar
                          affinityRequirements={affinityCurve[cost]}
                          maxValue={maxAffinityValue}
                        />
                      )}
                    </div>
                    <div className='text-xs text-gray-400 mt-1'>{cost}</div>
                    <div className='text-xs text-white'>
                      {affinityCurve[cost]
                        ? Object.values(affinityCurve[cost]).reduce(
                            (sum, val) => sum + val,
                            0
                          )
                        : 0}
                    </div>
                  </div>
                ))}

                {/* 10+ cost column */}
                <div className='flex flex-col items-center flex-1'>
                  <div className='w-full flex flex-col justify-end h-24'>
                    {Object.entries(affinityCurve).filter(
                      ([cost]) => parseInt(cost) >= 10
                    ).length > 0 && (
                      <AffinityColorBar
                        affinityRequirements={Object.entries(affinityCurve)
                          .filter(([cost]) => parseInt(cost) >= 10)
                          .reduce(
                            (acc, [_, affinity]) => {
                              // Combine all affinities for costs >= 10 (take max values)
                              acc.fire = Math.max(acc.fire, affinity.fire);
                              acc.water = Math.max(acc.water, affinity.water);
                              acc.earth = Math.max(acc.earth, affinity.earth);
                              acc.wood = Math.max(acc.wood, affinity.wood);
                              acc.metal = Math.max(acc.metal, affinity.metal);
                              return acc;
                            },
                            {
                              fire: 0,
                              water: 0,
                              earth: 0,
                              wood: 0,
                              metal: 0,
                            } as AffinityRequirements
                          )}
                        maxValue={maxAffinityValue}
                      />
                    )}
                  </div>
                  <div className='text-xs text-gray-400 mt-1'>10+</div>
                  <div className='text-xs text-white'>
                    {Object.entries(affinityCurve).filter(
                      ([cost]) => parseInt(cost) >= 10
                    ).length > 0
                      ? Object.entries(affinityCurve)
                          .filter(([cost]) => parseInt(cost) >= 10)
                          .reduce((sum, [_, affinity]) => {
                            return (
                              sum +
                              Object.values(affinity).reduce((s, v) => s + v, 0)
                            );
                          }, 0)
                      : 0}
                  </div>
                </div>
              </div>
            </div>
          )}

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
            <div className='flex justify-center items-center'>
              {/* Pie Chart */}
              <div className='w-full max-w-lg mx-auto'>
                <Pie
                  data={{
                    // Create custom labels with counts included
                    labels: Object.entries(stats.typeDistribution).map(
                      ([type, count]) => `${type} (${count})`
                    ),
                    datasets: [
                      {
                        data: Object.values(stats.typeDistribution),
                        backgroundColor: [
                          "#EC2826", // Fire color
                          "#5ACBF3", // Water color
                          "#F38F30", // Earth color
                          "#6DBF59", // Wood color
                          "#D7D9D9", // Metal color
                          "#9B7CB9", // Colorless/Purple color
                        ],
                        borderColor: [
                          "rgba(236, 40, 38, 0.8)",
                          "rgba(90, 203, 243, 0.8)",
                          "rgba(243, 143, 48, 0.8)",
                          "rgba(109, 191, 89, 0.8)",
                          "rgba(215, 217, 217, 0.8)",
                          "rgba(155, 124, 185, 0.8)",
                        ],
                        borderWidth: 1,
                        hoverOffset: 10,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    layout: {
                      padding: {
                        top: 20,
                        bottom: 20,
                        left: 20,
                        right: 20,
                      },
                    },
                    plugins: {
                      legend: {
                        position: "bottom",
                        align: "center",
                        labels: {
                          color: "white",
                          font: {
                            size: 14,
                            weight: "bold",
                          },
                          padding: 15,
                          usePointStyle: true,
                          pointStyle: "circle",
                          // Sort labels alphabetically
                          sort: (a, b) => (a.text > b.text ? 1 : -1),
                          boxWidth: 15,
                          boxHeight: 15,
                        },
                      },
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce(
                              (a: number, b: number) => a + b,
                              0
                            );
                            const percentage = Math.round(
                              ((value as number) / total) * 100
                            );
                            return `${percentage}% (${value} cards)`;
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
