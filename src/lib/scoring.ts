/**
 * Scoring Utilities for DAGuesser
 *
 * Calculates points based on distance from the correct location.
 * Scoring is designed to reward precision while still giving partial
 * credit for reasonable guesses.
 */

export interface ScoringConfig {
  maxPoints: number;        // Maximum points for a perfect guess
  perfectRadius: number;    // Radius in meters for perfect score
  zeroPointRadius: number;  // Radius in meters where score becomes 0
  timeBonusMax: number;     // Maximum time bonus points
  timeBonusDecay: number;   // Seconds until time bonus reaches 0
}

// Default scoring configuration
export const DEFAULT_SCORING: ScoringConfig = {
  maxPoints: 1000,
  perfectRadius: 10,        // Within 10 meters = perfect score
  zeroPointRadius: 5000,    // Beyond 5km = no points
  timeBonusMax: 200,        // Up to 200 bonus points for speed
  timeBonusDecay: 30,       // Time bonus decays over 30 seconds
};

/**
 * Calculate score based on distance from correct location
 *
 * Uses an exponential decay formula:
 * - Within perfectRadius: full points
 * - Beyond perfectRadius: exponential decay
 * - Beyond zeroPointRadius: 0 points
 *
 * @param distanceMeters - Distance from correct location in meters
 * @param config - Scoring configuration
 * @returns Score (0 to maxPoints)
 */
export function calculateDistanceScore(
  distanceMeters: number,
  config: ScoringConfig = DEFAULT_SCORING,
): number {
  // Perfect score for very close guesses
  if (distanceMeters <= config.perfectRadius) {
    return config.maxPoints;
  }

  // No points for very far guesses
  if (distanceMeters >= config.zeroPointRadius) {
    return 0;
  }

  // Exponential decay between perfectRadius and zeroPointRadius
  // Using a curve that feels fair and rewarding
  const normalizedDistance =
    (distanceMeters - config.perfectRadius) /
    (config.zeroPointRadius - config.perfectRadius);

  // Exponential decay: score = maxPoints * e^(-k * normalizedDistance)
  // We want score ≈ 0 when normalizedDistance = 1, so k ≈ 5
  const decayFactor = 5;
  const score = config.maxPoints * Math.exp(-decayFactor * normalizedDistance);

  return Math.round(score);
}

/**
 * Calculate time bonus based on response time
 *
 * Faster responses get more bonus points, with linear decay.
 *
 * @param responseTimeMs - Time to respond in milliseconds
 * @param timeLimitSeconds - Total time limit for the round
 * @param config - Scoring configuration
 * @returns Time bonus (0 to timeBonusMax)
 */
export function calculateTimeBonus(
  responseTimeMs: number,
  timeLimitSeconds: number,
  config: ScoringConfig = DEFAULT_SCORING,
): number {
  const responseSeconds = responseTimeMs / 1000;

  // No bonus if response time exceeds the decay period
  if (responseSeconds >= config.timeBonusDecay) {
    return 0;
  }

  // Linear decay from timeBonusMax to 0
  const bonusRatio = 1 - responseSeconds / config.timeBonusDecay;
  return Math.round(config.timeBonusMax * bonusRatio);
}

/**
 * Calculate total score for a guess
 *
 * @param distanceMeters - Distance from correct location
 * @param responseTimeMs - Time to respond in milliseconds
 * @param timeLimitSeconds - Total time limit for the round
 * @param config - Scoring configuration
 * @returns Total score (distance score + time bonus)
 */
export function calculateTotalScore(
  distanceMeters: number,
  responseTimeMs: number,
  timeLimitSeconds: number,
  config: ScoringConfig = DEFAULT_SCORING,
): {
  distanceScore: number;
  timeBonus: number;
  totalScore: number;
} {
  const distanceScore = calculateDistanceScore(distanceMeters, config);
  const timeBonus = calculateTimeBonus(responseTimeMs, timeLimitSeconds, config);

  return {
    distanceScore,
    timeBonus,
    totalScore: distanceScore + timeBonus,
  };
}

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
export function getOrdinalSuffix(rank: number): string {
  // In German, we just use a period after the number
  return ".";
}

/**
 * Format rank for display (German style)
 */
export function formatRank(rank: number): string {
  return `${rank}${getOrdinalSuffix(rank)}`;
}
