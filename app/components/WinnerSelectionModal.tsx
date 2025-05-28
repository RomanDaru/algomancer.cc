"use client";

import { useState } from "react";
import { XMarkIcon, TrophyIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

interface Submission {
  _id: string;
  deck: {
    _id: string;
    name: string;
    description?: string;
  } | null;
  user: {
    _id: string;
    name: string;
    username: string | null;
  } | null;
  submittedAt: Date;
}

interface WinnerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitionId: string;
  submissions: Submission[];
  onWinnersSelected: () => void;
}

interface SelectedWinner {
  place: 1 | 2 | 3;
  submissionId: string;
  deckId: string;
  userId: string;
  votes: number;
}

export default function WinnerSelectionModal({
  isOpen,
  onClose,
  competitionId,
  submissions,
  onWinnersSelected,
}: WinnerSelectionModalProps) {
  const [selectedWinners, setSelectedWinners] = useState<SelectedWinner[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSelectWinner = (submission: Submission, place: 1 | 2 | 3) => {
    if (!submission.deck || !submission.user) return;

    // Remove any existing winner for this place
    const filteredWinners = selectedWinners.filter((w) => w.place !== place);

    // Add new winner
    const newWinner: SelectedWinner = {
      place,
      submissionId: submission._id,
      deckId: submission.deck._id,
      userId: submission.user?._id || submission._id, // Use actual userId from submission
      votes: 0, // Default to 0, can be updated manually
    };

    setSelectedWinners([...filteredWinners, newWinner]);
  };

  const handleRemoveWinner = (place: 1 | 2 | 3) => {
    setSelectedWinners(selectedWinners.filter((w) => w.place !== place));
  };

  const handleVotesChange = (place: 1 | 2 | 3, votes: number) => {
    setSelectedWinners(
      selectedWinners.map((w) =>
        w.place === place ? { ...w, votes: Math.max(0, votes) } : w
      )
    );
  };

  const handleSubmit = async () => {
    if (selectedWinners.length === 0) {
      toast.error("Please select at least one winner");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/competitions/${competitionId}/winners`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            winners: selectedWinners.map((w) => ({
              place: w.place,
              deckId: w.deckId,
              userId: w.userId,
              votes: w.votes,
            })),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Winners selected successfully!");
        onWinnersSelected();
        onClose();
      } else {
        toast.error(data.error || "Failed to select winners");
      }
    } catch (error) {
      console.error("Error selecting winners:", error);
      toast.error("Failed to select winners");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWinnerForPlace = (place: 1 | 2 | 3) => {
    return selectedWinners.find((w) => w.place === place);
  };

  const getSubmissionById = (submissionId: string) => {
    return submissions.find((s) => s._id === submissionId);
  };

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
      <div className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-algomancy-purple/20'>
          <div className='flex items-center'>
            <TrophyIcon className='w-6 h-6 text-algomancy-gold mr-2' />
            <h2 className='text-xl font-bold text-white'>
              Select Competition Winners
            </h2>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-white transition-colors'>
            <XMarkIcon className='w-6 h-6' />
          </button>
        </div>

        {/* Content */}
        <div className='p-6 overflow-y-auto max-h-[calc(90vh-140px)]'>
          {/* Selected Winners Display */}
          <div className='mb-6'>
            <h3 className='text-lg font-semibold text-white mb-4'>
              Selected Winners
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {[1, 2, 3].map((place) => {
                const winner = getWinnerForPlace(place as 1 | 2 | 3);
                const submission = winner
                  ? getSubmissionById(winner.submissionId)
                  : null;

                return (
                  <div
                    key={place}
                    className='bg-algomancy-dark border border-algomancy-purple/20 rounded-lg p-4'>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-lg font-semibold text-white'>
                        {place === 1
                          ? "🥇 1st Place"
                          : place === 2
                          ? "🥈 2nd Place"
                          : "🥉 3rd Place"}
                      </span>
                      {winner && (
                        <button
                          onClick={() => handleRemoveWinner(place as 1 | 2 | 3)}
                          className='text-red-400 hover:text-red-300 text-sm'>
                          Remove
                        </button>
                      )}
                    </div>

                    {winner && submission ? (
                      <div>
                        <p className='text-white font-medium'>
                          {submission.deck?.name}
                        </p>
                        <p className='text-gray-400 text-sm'>
                          {submission.user?.name}
                        </p>
                        <div className='mt-2'>
                          <label className='block text-xs text-gray-400 mb-1'>
                            Votes
                          </label>
                          <input
                            type='number'
                            min='0'
                            value={winner.votes}
                            onChange={(e) =>
                              handleVotesChange(
                                place as 1 | 2 | 3,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className='w-full px-2 py-1 bg-algomancy-darker border border-algomancy-purple/30 rounded text-white text-sm'
                          />
                        </div>
                      </div>
                    ) : (
                      <p className='text-gray-400 text-sm'>
                        No winner selected
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submissions List */}
          <div>
            <h3 className='text-lg font-semibold text-white mb-4'>
              Select from Submissions
            </h3>
            <div className='space-y-3'>
              {submissions.map((submission) => (
                <div
                  key={submission._id}
                  className='bg-algomancy-dark border border-algomancy-purple/20 rounded-lg p-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <h4 className='text-white font-medium'>
                        {submission.deck?.name || "Unknown Deck"}
                      </h4>
                      <p className='text-gray-400 text-sm'>
                        {submission.user?.name || "Unknown User"}
                      </p>
                      {submission.deck?.description && (
                        <p className='text-gray-300 text-sm mt-1'>
                          {submission.deck.description}
                        </p>
                      )}
                    </div>
                    <div className='flex space-x-2'>
                      {[1, 2, 3].map((place) => (
                        <button
                          key={place}
                          onClick={() =>
                            handleSelectWinner(submission, place as 1 | 2 | 3)
                          }
                          disabled={!!getWinnerForPlace(place as 1 | 2 | 3)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            getWinnerForPlace(place as 1 | 2 | 3)
                              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                              : place === 1
                              ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                              : place === 2
                              ? "bg-gray-500 hover:bg-gray-600 text-white"
                              : "bg-orange-600 hover:bg-orange-700 text-white"
                          }`}>
                          {place === 1 ? "1st" : place === 2 ? "2nd" : "3rd"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='flex items-center justify-end space-x-4 p-6 border-t border-algomancy-purple/20'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-gray-300 hover:text-white transition-colors'>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedWinners.length === 0}
            className='px-6 py-2 bg-algomancy-gold hover:bg-algomancy-gold-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-black font-medium transition-colors'>
            {isSubmitting ? "Setting Winners..." : "Set Winners"}
          </button>
        </div>
      </div>
    </div>
  );
}
