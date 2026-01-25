/**
 * Shared game types used across player (game-modes) and moderator components.
 *
 * These types define the core game concepts that are used in both contexts:
 * - Players see rounds, locations, and submit guesses
 * - Moderators see the same data but with additional control/statistics
 */

import type { Id } from "@/convex/_generated/dataModel";

/**
 * The possible states of a round in the game flow.
 */
export type RoundStatus =
  | "pending"
  | "showing"
  | "guessing"
  | "reveal"
  | "completed";

/**
 * The game mode determines how a round is played.
 * - imageToUtm: Players see an image and guess the UTM coordinates
 * - utmToLocation: Players see UTM coordinates and find the location on a map
 */
export type GameMode = "imageToUtm" | "utmToLocation";

/**
 * The possible states of the overall game.
 */
export type GameStatus = "lobby" | "playing" | "paused" | "finished";

/**
 * Location data for a round. Contains the target location that players guess.
 */
export interface LocationData {
  name: string;
  utmZone?: string;
  utmEasting?: number;
  utmNorthing?: number;
  imageUrls?: string[];
}

/**
 * A player's guess result after a round is revealed.
 */
export interface GuessResult {
  guessedUtmEasting?: number;
  guessedUtmNorthing?: number;
  score?: number;
  distanceMeters?: number | null;
}

/**
 * State for UTM coordinate input fields.
 */
export interface GuessInputState {
  eastingInput: string;
  northingInput: string;
  isSubmitting: boolean;
  submitError: string | null;
}

/**
 * Actions for controlling UTM coordinate input.
 */
export interface GuessInputActions {
  setEastingInput: (value: string) => void;
  setNorthingInput: (value: string) => void;
  handleSubmit: () => Promise<void>;
}

/**
 * Round data with all fields needed for display.
 */
export interface RoundData {
  _id: Id<"rounds">;
  roundNumber: number;
  status: RoundStatus;
  mode: GameMode;
  timeLimit: number;
  countdownEndsAt?: number;
  guessCount?: number;
  totalTeams?: number;
  allTeamsGuessed?: boolean;
  location?: LocationData;
}

/**
 * Game data for moderator views.
 */
export interface GameData {
  _id: Id<"games">;
  name: string;
  joinCode: string;
  status: GameStatus;
  totalRounds?: number;
  teamCount?: number;
}

/**
 * Team data for moderator views.
 */
export interface TeamData {
  _id: Id<"teams">;
  name: string;
  score: number;
  isActive: boolean;
}

/**
 * Leaderboard entry with ranking information.
 */
export interface LeaderboardEntryData {
  teamId: string;
  teamName: string;
  score: number;
  rank: number;
  isActive: boolean;
  roundScores?: Array<{
    roundNumber: number;
    score: number;
    distanceMeters: number;
  }>;
}
