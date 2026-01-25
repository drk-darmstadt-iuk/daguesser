/**
 * Shared types for game mode components
 */

export type RoundStatus =
  | "pending"
  | "showing"
  | "guessing"
  | "reveal"
  | "completed";

export interface LocationData {
  name: string;
  utmZone?: string;
  utmEasting?: number;
  utmNorthing?: number;
  imageUrls?: string[];
}

export interface GuessInputState {
  eastingInput: string;
  northingInput: string;
  isSubmitting: boolean;
  submitError: string | null;
}

export interface GuessInputActions {
  setEastingInput: (value: string) => void;
  setNorthingInput: (value: string) => void;
  handleSubmit: () => Promise<void>;
}

export interface GuessResult {
  guessedUtmEasting?: number;
  guessedUtmNorthing?: number;
  score?: number;
  distanceMeters?: number | null;
}

export interface GameModeShowingProps {
  location: LocationData;
  timeLimit: number;
}

export interface GameModeGuessingProps {
  location: LocationData;
  countdownEndsAt: number | null;
  timeLimit: number;
  hasGuessed: boolean;
  inputState: GuessInputState;
  inputActions: GuessInputActions;
}

export interface GameModeRevealProps {
  location: LocationData;
  guessResult: GuessResult | null;
}
