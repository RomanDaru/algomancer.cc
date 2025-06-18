import { Competition } from "../types/user";
import { updateCompetitionStatus } from "./competitionStatus";

/**
 * Client-side competition status update utility
 * Since cron jobs on Vercel Hobby plan only run once per day,
 * we need client-side status updates for real-time accuracy
 */

/**
 * Update competition status on the client side
 * This ensures status is always current even between cron runs
 */
export function updateCompetitionStatusClient(competition: Competition): Competition {
  return updateCompetitionStatus(competition);
}

/**
 * Update multiple competitions' statuses on the client side
 */
export function updateCompetitionsStatusClient(competitions: Competition[]): Competition[] {
  return competitions.map(updateCompetitionStatusClient);
}

/**
 * Check if a competition status needs updating
 * Useful for determining if we should trigger a status update
 */
export function shouldUpdateCompetitionStatus(competition: Competition): boolean {
  const updated = updateCompetitionStatus(competition);
  return updated.status !== competition.status;
}

/**
 * Get competitions that need status updates
 */
export function getCompetitionsNeedingUpdate(competitions: Competition[]): Competition[] {
  return competitions.filter(shouldUpdateCompetitionStatus);
}

/**
 * Hook for automatic client-side status updates
 * Call this in components that display competitions
 */
export function useClientStatusUpdate(competitions: Competition[]): Competition[] {
  // Update statuses on the client side for real-time accuracy
  return updateCompetitionsStatusClient(competitions);
}

/**
 * Manual status update trigger for admin use
 * This can be called manually if needed between cron runs
 */
export async function triggerManualStatusUpdate(): Promise<{
  success: boolean;
  message: string;
  updatedCount?: number;
}> {
  try {
    const response = await fetch('/api/cron/update-competition-status', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'manual-trigger'}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        message: data.data?.message || 'Status update completed',
        updatedCount: data.data?.updatedCount || 0,
      };
    } else {
      throw new Error(data.error || 'Status update failed');
    }
  } catch (error) {
    console.error('Manual status update failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
