/**
 * Display Utilities for DAGuesser Scoring
 *
 * NOTE: Actual score calculation happens ONLY on the backend
 * in src/convex/lib/scoring.ts to prevent client manipulation.
 *
 * This file contains only display/formatting utilities.
 */

/**
 * Get a descriptive rating for a guess based on distance
 */
export function getDistanceRating(distanceMeters: number): {
  rating: "perfect" | "excellent" | "good" | "fair" | "poor" | "miss";
  emoji: string;
  label: string;
} {
  if (distanceMeters <= 10) {
    return { rating: "perfect", emoji: "", label: "Perfekt!" };
  }
  if (distanceMeters <= 50) {
    return { rating: "excellent", emoji: "", label: "Ausgezeichnet!" };
  }
  if (distanceMeters <= 200) {
    return { rating: "good", emoji: "", label: "Gut!" };
  }
  if (distanceMeters <= 500) {
    return { rating: "fair", emoji: "", label: "Nicht schlecht" };
  }
  if (distanceMeters <= 2000) {
    return { rating: "poor", emoji: "", label: "Daneben" };
  }
  return { rating: "miss", emoji: "", label: "Weit daneben" };
}

/**
 * Format distance for display
 */
export function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }
  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

/**
 * Format distance for compact display (shorter format)
 */
export function formatDistanceShort(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)}m`;
  }
  if (distanceMeters < 10000) {
    return `${(distanceMeters / 1000).toFixed(1)}km`;
  }
  return `${Math.round(distanceMeters / 1000)}km`;
}

/**
 * Calculate rank positions for a list of teams
 * Teams with the same score get the same rank
 */
export function calculateRanks(
  teams: Array<{ id: string; score: number }>,
): Map<string, number> {
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  const ranks = new Map<string, number>();

  let currentRank = 1;
  let previousScore = -1;
  let sameRankCount = 0;

  for (const team of sorted) {
    if (team.score === previousScore) {
      // Same score as previous team, same rank
      sameRankCount++;
    } else {
      // New score, update rank (skip positions for tied teams)
      currentRank = currentRank + sameRankCount;
      sameRankCount = 1;
      previousScore = team.score;
    }
    ranks.set(team.id, currentRank);
  }

  return ranks;
}

/**
 * Get ordinal suffix for a rank number (German)
 */
export function getOrdinalSuffix(_rank: number): string {
  // In German, we just use a period after the number
  return ".";
}

/**
 * Format rank for display (German style)
 */
export function formatRank(rank: number): string {
  return `${rank}${getOrdinalSuffix(rank)}`;
}
