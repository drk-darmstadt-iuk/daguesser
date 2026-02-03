/**
 * Deterministic Shuffle Utilities
 *
 * Provides seeded random shuffle for consistent ordering across clients.
 */

/**
 * Generate a hash from a string seed.
 * Simple hash function for seeding the RNG.
 *
 * @param seed - String to hash
 * @returns 32-bit integer hash
 */
function hashString(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  return hash;
}

/**
 * Simple Linear Congruential Generator (LCG) for seeded random numbers.
 * Uses constants from Numerical Recipes.
 *
 * @param state - Current RNG state
 * @returns Next RNG state
 */
function nextRandom(state: number): number {
  return (state * 1103515245 + 12345) & 0x7fffffff;
}

/**
 * Shuffle an array deterministically using a string seed.
 *
 * Uses Fisher-Yates shuffle with a seeded RNG to ensure the same
 * seed always produces the same shuffle order. This is useful for
 * ensuring all clients see the same option order without coordination.
 *
 * @param array - Array to shuffle (not modified)
 * @param seed - String seed for deterministic shuffle (e.g., round ID)
 * @returns New shuffled array
 *
 * @example
 * ```ts
 * const options = ["A", "B", "C", "D"];
 * const shuffled = shuffleWithSeed(options, "round-123");
 * // Always returns same order for same seed
 * ```
 */
export function shuffleWithSeed<T>(array: T[], seed: string): T[] {
  const result = [...array];

  if (result.length <= 1) {
    return result;
  }

  let state = hashString(seed);

  // Fisher-Yates shuffle with seeded RNG
  for (let i = result.length - 1; i > 0; i--) {
    state = nextRandom(state);
    // Generate index in range [0, i]
    const j = Math.floor((state / 0x7fffffff) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}
