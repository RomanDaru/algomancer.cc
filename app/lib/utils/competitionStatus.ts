import { Competition } from "../types/user";

/**
 * Determine the correct status for a competition based on current date
 */
export function getCompetitionStatus(
  startDate: Date,
  endDate: Date,
  votingEndDate: Date
): Competition["status"] {
  const now = new Date();

  if (now < startDate) {
    return "upcoming";
  } else if (now >= startDate && now < endDate) {
    return "active";
  } else if (now >= endDate && now < votingEndDate) {
    return "voting";
  } else {
    return "completed";
  }
}

/**
 * Update a competition's status based on current date
 * Respects manually set "completed" status (when winners are selected)
 */
export function updateCompetitionStatus(competition: Competition): Competition {
  // If competition is already completed (winners selected), don't change status
  if (competition.status === "completed") {
    return competition;
  }

  const correctStatus = getCompetitionStatus(
    competition.startDate,
    competition.endDate,
    competition.votingEndDate
  );

  return {
    ...competition,
    status: correctStatus,
  };
}

/**
 * Update multiple competitions' statuses based on current date
 */
export function updateCompetitionsStatus(
  competitions: Competition[]
): Competition[] {
  return competitions.map(updateCompetitionStatus);
}
