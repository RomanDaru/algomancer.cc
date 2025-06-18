import Link from "next/link";
import { TrophyIcon, StarIcon } from "@heroicons/react/24/outline";
import { CompetitionWinner, Competition } from "@/app/lib/types/user";
import Badge, { BADGE_CONFIGS } from "./Badge";

interface WinnersPodiumProps {
  winners: CompetitionWinner[];
  title?: string;
  competition?: Competition;
}

export default function WinnersPodium({
  winners,
  title = "Competition Winners",
  competition,
}: WinnersPodiumProps) {
  // Generate badge for 1st place winner if competition data is available
  const generateBadgeForWinner = (winner: CompetitionWinner) => {
    if (winner.place !== 1 || !competition) return null;

    const month = competition.endDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
    const badgeType =
      competition.type === "constructed"
        ? "best_constructed_monthly"
        : "best_draft_monthly";
    const config = BADGE_CONFIGS[badgeType];

    return {
      _id: `temp-${winner.userId}` as any,
      type: badgeType,
      title: config.getTitle(month),
      description: config.getDescription(month),
      icon: config.icon,
      color: config.color,
      month: competition.endDate.toISOString().slice(0, 7), // YYYY-MM format
      awardedAt: new Date(),
      createdAt: new Date(),
    };
  };
  if (winners.length === 0) {
    return null;
  }

  return (
    <div className='bg-algomancy-darker border border-algomancy-gold/30 rounded-lg p-8'>
      <h2 className='text-2xl font-bold text-white mb-6 flex items-center'>
        <TrophyIcon className='w-6 h-6 mr-2 text-algomancy-gold' />
        {title}
      </h2>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {winners.map((winner) => (
          <div
            key={winner.place}
            className='bg-algomancy-dark border border-algomancy-gold/20 rounded-lg p-6 text-center'>
            <div className='text-3xl mb-3'>
              {winner.place === 1 ? "🥇" : winner.place === 2 ? "🥈" : "🥉"}
            </div>
            <div className='text-lg font-semibold text-white mb-2'>
              {winner.place === 1
                ? "1st Place"
                : winner.place === 2
                ? "2nd Place"
                : "3rd Place"}
            </div>

            {/* Winner Name */}
            {winner.user && (
              <div className='font-medium mb-2'>
                {winner.user.username ? (
                  <span className='text-algomancy-gold'>
                    @{winner.user.username}
                  </span>
                ) : (
                  <span className='text-gray-300'>
                    {winner.user.name || "Unknown User"}
                  </span>
                )}
              </div>
            )}

            {/* Badge for 1st place winners */}
            {winner.place === 1 &&
              (() => {
                const badge = generateBadgeForWinner(winner);
                return badge ? (
                  <div className='mb-3'>
                    <Badge badge={badge} size='small' />
                  </div>
                ) : null;
              })()}

            {/* Deck Name */}
            {winner.deck && (
              <div className='text-gray-300 text-sm mb-3'>
                {winner.deck.name}
              </div>
            )}

            {winner.votes && (
              <div className='text-gray-400 text-sm mb-3'>
                {winner.votes} votes
              </div>
            )}
            <Link
              href={`/decks/${winner.deckId}`}
              className='inline-flex items-center px-4 py-2 bg-algomancy-gold hover:bg-algomancy-gold-dark rounded-md text-black font-medium transition-colors'>
              View Deck
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
