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
 * - directionDistance: Players see a starting point and bearing/distance, find the destination
 * - multipleChoice: Players see an image and choose from 4 location options
 */
export type GameMode =
  | "imageToUtm"
  | "utmToLocation"
  | "directionDistance"
  | "multipleChoice";

/**
 * The possible states of the overall game.
 */
export type GameStatus = "lobby" | "playing" | "paused" | "finished";

/**
 * Location data for a round. Contains the target location that players guess.
 * Note: `name` is optional because it's hidden during showing/guessing for MC mode.
 */
export interface LocationData {
  name?: string;
  utmZone?: string;
  utmEasting?: number;
  utmNorthing?: number;
  latitude?: number;
  longitude?: number;
  imageUrls?: string[];
  // For direction & distance mode
  bearingDegrees?: number;
  distanceMeters?: number;
  startPointName?: string;
  startPointImageUrls?: string[];
  startPointLatitude?: number;
  startPointLongitude?: number;
  // For multiple choice mode
  mcOptions?: string[];
}

/**
 * A player's guess result after a round is revealed.
 */
export interface GuessResult {
  guessedUtmEasting?: number;
  guessedUtmNorthing?: number;
  guessedLatitude?: number;
  guessedLongitude?: number;
  score?: number;
  distanceScore?: number;
  timeBonus?: number;
  distanceMeters?: number | null;
  // For multiple choice mode
  guessedOptionIndex?: number;
  guessedOptionName?: string;
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
 * State for map position input (utmToLocation mode).
 */
export interface MapInputState {
  guessedPosition: { lat: number; lng: number } | null;
  isSubmitting: boolean;
  submitError: string | null;
}

/**
 * Actions for controlling map position input.
 */
export interface MapInputActions {
  setGuessedPosition: (position: { lat: number; lng: number } | null) => void;
  handleSubmit: () => Promise<void>;
}

/**
 * State for multiple choice input.
 */
export interface MultipleChoiceInputState {
  selectedOptionIndex: number | null;
  isSubmitting: boolean;
  submitError: string | null;
}

/**
 * Actions for controlling multiple choice input.
 */
export interface MultipleChoiceInputActions {
  setSelectedOptionIndex: (index: number | null) => void;
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
  // Multiple Choice mode: server-computed shuffle
  mcShuffledOptions?: string[];
  mcCorrectIndex?: number;
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
