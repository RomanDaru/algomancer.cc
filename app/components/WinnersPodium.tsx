import Link from "next/link";
import { TrophyIcon } from "@heroicons/react/24/outline";
import { CompetitionWinner } from "@/app/lib/types/user";

interface WinnersPodiumProps {
  winners: CompetitionWinner[];
  title?: string;
}

export default function WinnersPodium({ winners, title = "Competition Winners" }: WinnersPodiumProps) {
  if (winners.length === 0) {
    return null;
  }

  return (
    <div className="bg-algomancy-darker border border-algomancy-gold/30 rounded-lg p-8">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
        <TrophyIcon className="w-6 h-6 mr-2 text-algomancy-gold" />
        {title}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {winners.map((winner) => (
          <div key={winner.place} className="bg-algomancy-dark border border-algomancy-gold/20 rounded-lg p-6 text-center">
            <div className="text-3xl mb-3">
              {winner.place === 1 ? "🥇" : winner.place === 2 ? "🥈" : "🥉"}
            </div>
            <div className="text-lg font-semibold text-white mb-2">
              {winner.place === 1 ? "1st Place" : winner.place === 2 ? "2nd Place" : "3rd Place"}
            </div>
            {winner.votes && (
              <div className="text-gray-400 text-sm mb-3">
                {winner.votes} votes
              </div>
            )}
            <Link 
              href={`/decks/${winner.deckId}`}
              className="inline-flex items-center px-4 py-2 bg-algomancy-gold hover:bg-algomancy-gold-dark rounded-md text-black font-medium transition-colors"
            >
              View Deck
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
