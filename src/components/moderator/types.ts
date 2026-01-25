/**
 * Shared types for moderator components
 */

import type { Id } from "@/convex/_generated/dataModel";

export type GameStatus = "lobby" | "playing" | "paused" | "finished";
export type RoundStatusValue =
  | "pending"
  | "showing"
  | "guessing"
  | "reveal"
  | "completed";
export type GameModeValue = "imageToUtm" | "utmToLocation";

export interface LocationData {
  name: string;
  utmZone?: string;
  utmEasting?: number;
  utmNorthing?: number;
  imageUrls?: string[];
}

export interface RoundData {
  _id: Id<"rounds">;
  roundNumber: number;
  status: RoundStatusValue;
  mode: GameModeValue;
  timeLimit: number;
  countdownEndsAt?: number;
  guessCount?: number;
  totalTeams?: number;
  allTeamsGuessed?: boolean;
  location?: LocationData;
}

export interface GameData {
  _id: Id<"games">;
  name: string;
  joinCode: string;
  status: GameStatus;
  totalRounds?: number;
  teamCount?: number;
}

export interface TeamData {
  _id: Id<"teams">;
  name: string;
  score: number;
  isActive: boolean;
}

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
