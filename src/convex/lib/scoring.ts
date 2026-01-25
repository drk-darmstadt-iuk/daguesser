/**
 * Scoring utilities for Convex backend.
 *
 * These functions are used for calculating scores in the game.
 * They're kept in the convex folder since Convex can't import
 * from outside its folder.
 */

/**
 * Calculate distance between two points using Haversine formula.
 * Returns distance in meters.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate UTM distance (Euclidean for same zone).
 * Returns distance in meters.
 */
export function utmDistance(
  e1: number,
  n1: number,
  e2: number,
  n2: number,
): number {
  const dE = e2 - e1;
  const dN = n2 - n1;
  return Math.sqrt(dE * dE + dN * dN);
}

/**
 * Calculate score based on distance from correct location.
 *
 * Uses an exponential decay formula:
 * - Within 10m: full 1000 points
 * - Beyond 10m: exponential decay
 * - Beyond 5km: 0 points
 */
export function calculateScore(distanceMeters: number): number {
  const maxPoints = 1000;
  const perfectRadius = 10;
  const zeroPointRadius = 5000;

  if (distanceMeters <= perfectRadius) {
    return maxPoints;
  }
  if (distanceMeters >= zeroPointRadius) {
    return 0;
  }

  const normalizedDistance =
    (distanceMeters - perfectRadius) / (zeroPointRadius - perfectRadius);
  const score = maxPoints * Math.exp(-5 * normalizedDistance);
  return Math.round(score);
}
