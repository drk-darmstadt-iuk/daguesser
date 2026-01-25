"use client";

import {
  ImageToUtmGuessing,
  ImageToUtmReveal,
  ImageToUtmShowing,
} from "./ImageToUtmMode";
import type {
  GuessInputActions,
  GuessInputState,
  GuessResult,
  LocationData,
  RoundStatus,
} from "./types";
import {
  UtmToLocationGuessing,
  UtmToLocationReveal,
  UtmToLocationShowing,
} from "./UtmToLocationMode";

export type GameMode = "imageToUtm" | "utmToLocation";

interface GameModeRendererProps {
  mode: GameMode;
  status: RoundStatus;
  location: LocationData;
  timeLimit: number;
  countdownEndsAt: number | null;
  hasGuessed: boolean;
  guessResult: GuessResult | null;
  inputState: GuessInputState;
  inputActions: GuessInputActions;
}

/**
 * Renders the appropriate game mode UI based on the current round status.
 * This component acts as a dispatcher to the specific mode components,
 * making it easy to add new game modes in the future.
 */
export function GameModeRenderer({
  mode,
  status,
  location,
  timeLimit,
  countdownEndsAt,
  hasGuessed,
  guessResult,
  inputState,
  inputActions,
}: GameModeRendererProps): React.ReactElement | null {
  if (status === "showing") {
    return renderShowingState(mode, location, timeLimit);
  }

  if (status === "guessing") {
    return renderGuessingState(
      mode,
      location,
      countdownEndsAt,
      timeLimit,
      hasGuessed,
      inputState,
      inputActions,
    );
  }

  if (status === "reveal" || status === "completed") {
    return renderRevealState(mode, location, guessResult);
  }

  return null;
}

function renderShowingState(
  mode: GameMode,
  location: LocationData,
  timeLimit: number,
): React.ReactElement | null {
  switch (mode) {
    case "imageToUtm":
      return <ImageToUtmShowing location={location} timeLimit={timeLimit} />;
    case "utmToLocation":
      return <UtmToLocationShowing location={location} timeLimit={timeLimit} />;
    default:
      return null;
  }
}

function renderGuessingState(
  mode: GameMode,
  location: LocationData,
  countdownEndsAt: number | null,
  timeLimit: number,
  hasGuessed: boolean,
  inputState: GuessInputState,
  inputActions: GuessInputActions,
): React.ReactElement | null {
  switch (mode) {
    case "imageToUtm":
      return (
        <ImageToUtmGuessing
          location={location}
          countdownEndsAt={countdownEndsAt}
          timeLimit={timeLimit}
          hasGuessed={hasGuessed}
          inputState={inputState}
          inputActions={inputActions}
        />
      );
    case "utmToLocation":
      return (
        <UtmToLocationGuessing
          location={location}
          countdownEndsAt={countdownEndsAt}
          timeLimit={timeLimit}
          hasGuessed={hasGuessed}
          inputState={inputState}
          inputActions={inputActions}
        />
      );
    default:
      return null;
  }
}

function renderRevealState(
  mode: GameMode,
  location: LocationData,
  guessResult: GuessResult | null,
): React.ReactElement | null {
  switch (mode) {
    case "imageToUtm":
      return <ImageToUtmReveal location={location} guessResult={guessResult} />;
    case "utmToLocation":
      return (
        <UtmToLocationReveal location={location} guessResult={guessResult} />
      );
    default:
      return null;
  }
}
