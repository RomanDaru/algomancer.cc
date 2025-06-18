import { Competition, Deck } from "../types/user";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  fieldErrors?: Record<string, string[]>;
}

export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate competition creation/update data
 */
export function validateCompetitionData(
  data: Partial<Competition>
): ValidationResult {
  const errors: string[] = [];
  const fieldErrors: Record<string, string[]> = {};

  // Helper function to add field-specific errors
  const addFieldError = (field: string, error: string) => {
    errors.push(error);
    if (!fieldErrors[field]) fieldErrors[field] = [];
    fieldErrors[field].push(error);
  };

  // Required fields
  if (!data.title?.trim()) {
    addFieldError("title", "Title is required");
  } else if (data.title.length < 3) {
    addFieldError("title", "Title must be at least 3 characters long");
  } else if (data.title.length > 100) {
    addFieldError("title", "Title must be less than 100 characters");
  }

  if (!data.description?.trim()) {
    addFieldError("description", "Description is required");
  } else if (data.description.length < 10) {
    addFieldError(
      "description",
      "Description must be at least 10 characters long"
    );
  } else if (data.description.length > 1000) {
    addFieldError(
      "description",
      "Description must be less than 1000 characters"
    );
  }

  if (!data.type) {
    addFieldError("type", "Competition type is required");
  }

  // Date validation
  if (data.startDate && data.endDate && data.votingEndDate) {
    const now = new Date();
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const votingEnd = new Date(data.votingEndDate);

    // Check for past dates (allow some buffer for editing existing competitions)
    const isNewCompetition = !data._id;
    if (isNewCompetition && start < now) {
      errors.push("Start date cannot be in the past");
    }

    // Check date sequence
    if (start >= end) {
      errors.push("End date must be after start date");
    }

    if (end >= votingEnd) {
      errors.push("Voting end date must be after competition end date");
    }

    // Check minimum durations
    const competitionDuration = end.getTime() - start.getTime();
    const votingDuration = votingEnd.getTime() - end.getTime();

    const minCompetitionDuration = 24 * 60 * 60 * 1000; // 1 day
    const minVotingDuration = 24 * 60 * 60 * 1000; // 1 day

    if (competitionDuration < minCompetitionDuration) {
      errors.push("Competition must run for at least 1 day");
    }

    if (votingDuration < minVotingDuration) {
      errors.push("Voting period must be at least 1 day");
    }

    // Check maximum durations (prevent extremely long competitions)
    const maxCompetitionDuration = 30 * 24 * 60 * 60 * 1000; // 30 days
    const maxVotingDuration = 14 * 24 * 60 * 60 * 1000; // 14 days

    if (competitionDuration > maxCompetitionDuration) {
      errors.push("Competition cannot run for more than 30 days");
    }

    if (votingDuration > maxVotingDuration) {
      errors.push("Voting period cannot be more than 14 days");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    fieldErrors,
  };
}

/**
 * Validate deck submission for competition
 */
export function validateDeckSubmission(deck: Deck): ValidationResult {
  const errors: string[] = [];

  // Check if deck is public
  if (!deck.isPublic) {
    errors.push("Deck must be public to submit to competition");
  }

  // Check if deck has cards
  if (!deck.cards || deck.cards.length === 0) {
    errors.push("Deck cannot be empty");
  }

  // Check deck size (Algomancy rules)
  const totalCards = deck.cards.reduce((sum, card) => sum + card.quantity, 0);
  if (totalCards < 20) {
    errors.push("Deck must contain at least 20 cards");
  }
  if (totalCards > 60) {
    errors.push("Deck cannot contain more than 60 cards");
  }

  // Check card quantity limits (max 2 per card in Algomancy)
  const invalidCards = deck.cards.filter((card) => card.quantity > 2);
  if (invalidCards.length > 0) {
    errors.push("No card can appear more than 2 times in a deck");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate winner selection
 */
export function validateWinners(winners: any[]): ValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(winners)) {
    errors.push("Winners must be an array");
    return { isValid: false, errors };
  }

  if (winners.length === 0) {
    errors.push("At least one winner must be selected");
  }

  if (winners.length > 3) {
    errors.push("Cannot have more than 3 winners");
  }

  // Check for duplicate places
  const places = winners.map((w) => w.place);
  const uniquePlaces = new Set(places);
  if (places.length !== uniquePlaces.size) {
    errors.push("Duplicate winner places are not allowed");
  }

  // Validate each winner
  winners.forEach((winner, index) => {
    if (!winner.place || ![1, 2, 3].includes(winner.place)) {
      errors.push(`Winner ${index + 1}: Place must be 1, 2, or 3`);
    }

    if (!winner.deckId) {
      errors.push(`Winner ${index + 1}: Deck ID is required`);
    }

    if (!winner.userId) {
      errors.push(`Winner ${index + 1}: User ID is required`);
    }

    if (
      winner.votes !== undefined &&
      (typeof winner.votes !== "number" || winner.votes < 0)
    ) {
      errors.push(`Winner ${index + 1}: Votes must be a non-negative number`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Client-side field validation functions
 */

export function validateTitle(title: string): FieldValidationResult {
  if (!title?.trim()) {
    return { isValid: false, error: "Title is required" };
  }
  if (title.length < 3) {
    return {
      isValid: false,
      error: "Title must be at least 3 characters long",
    };
  }
  if (title.length > 100) {
    return { isValid: false, error: "Title must be less than 100 characters" };
  }
  return { isValid: true };
}

export function validateDescription(
  description: string
): FieldValidationResult {
  if (!description?.trim()) {
    return { isValid: false, error: "Description is required" };
  }
  if (description.length < 10) {
    return {
      isValid: false,
      error: "Description must be at least 10 characters long",
    };
  }
  if (description.length > 1000) {
    return {
      isValid: false,
      error: "Description must be less than 1000 characters",
    };
  }
  return { isValid: true };
}

export function validateDates(
  startDate: string,
  endDate: string,
  votingEndDate: string,
  isNewCompetition: boolean = true
): FieldValidationResult {
  if (!startDate || !endDate || !votingEndDate) {
    return { isValid: false, error: "All dates are required" };
  }

  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const votingEnd = new Date(votingEndDate);

  // Check for invalid dates
  if (
    isNaN(start.getTime()) ||
    isNaN(end.getTime()) ||
    isNaN(votingEnd.getTime())
  ) {
    return { isValid: false, error: "Invalid date format" };
  }

  // Check for past dates (only for new competitions)
  if (isNewCompetition && start < now) {
    return { isValid: false, error: "Start date cannot be in the past" };
  }

  // Check date sequence
  if (start >= end) {
    return { isValid: false, error: "End date must be after start date" };
  }

  if (end >= votingEnd) {
    return {
      isValid: false,
      error: "Voting end date must be after competition end date",
    };
  }

  // Check minimum durations
  const competitionDuration = end.getTime() - start.getTime();
  const votingDuration = votingEnd.getTime() - end.getTime();

  const minCompetitionDuration = 24 * 60 * 60 * 1000; // 1 day
  const minVotingDuration = 24 * 60 * 60 * 1000; // 1 day

  if (competitionDuration < minCompetitionDuration) {
    return { isValid: false, error: "Competition must run for at least 1 day" };
  }

  if (votingDuration < minVotingDuration) {
    return { isValid: false, error: "Voting period must be at least 1 day" };
  }

  return { isValid: true };
}

export function validateDeckForSubmission(deck: any): FieldValidationResult {
  if (!deck) {
    return { isValid: false, error: "Deck is required" };
  }

  if (!deck.isPublic) {
    return {
      isValid: false,
      error: "Deck must be public to submit to competition",
    };
  }

  if (!deck.cards || deck.cards.length === 0) {
    return { isValid: false, error: "Deck cannot be empty" };
  }

  const totalCards = deck.cards.reduce(
    (sum: number, card: any) => sum + card.quantity,
    0
  );
  if (totalCards < 20) {
    return { isValid: false, error: "Deck must contain at least 20 cards" };
  }
  if (totalCards > 60) {
    return { isValid: false, error: "Deck cannot contain more than 60 cards" };
  }

  const invalidCards = deck.cards.filter((card: any) => card.quantity > 2);
  if (invalidCards.length > 0) {
    return {
      isValid: false,
      error: "No card can appear more than 2 times in a deck",
    };
  }

  return { isValid: true };
}
