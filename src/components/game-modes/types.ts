/**
 * Types for game mode components (player view).
 *
 * Re-exports shared types and defines player-specific prop interfaces.
 */

export type {
  GameMode,
  GuessInputActions,
  GuessInputState,
  GuessResult,
  LocationData,
  MapInputActions,
  MapInputState,
  MultipleChoiceInputActions,
  MultipleChoiceInputState,
  RoundStatus,
} from "@/types/game";

import type {
  GuessInputActions,
  GuessInputState,
  GuessResult,
  LocationData,
  MapInputActions,
  MapInputState,
} from "@/types/game";

/**
 * Props for game mode "showing" phase (before countdown starts).
 */
export interface GameModeShowingProps {
  location: LocationData;
  timeLimit: number;
}

/**
 * Props for game mode "guessing" phase (countdown active).
 */
export interface GameModeGuessingProps {
  location: LocationData;
  countdownEndsAt: number | null;
  timeLimit: number;
  hasGuessed: boolean;
  inputState: GuessInputState;
  inputActions: GuessInputActions;
  mapInputState?: MapInputState;
  mapInputActions?: MapInputActions;
}

/**
 * Props for game mode "reveal" phase (showing correct answer).
 */
export interface GameModeRevealProps {
  location: LocationData;
  guessResult: GuessResult | null;
}
