/**
 * Types for moderator components.
 *
 * Re-exports shared game types for convenience.
 * Moderator-specific types can be added here if needed.
 */

/**
 * Type aliases for backwards compatibility with existing code.
 * These match the original names used in moderator components.
 */
export type {
  GameData,
  GameMode,
  GameMode as GameModeValue,
  GameStatus,
  LeaderboardEntryData,
  LocationData,
  RoundData,
  RoundStatus,
  RoundStatus as RoundStatusValue,
  TeamData,
} from "@/types/game";
