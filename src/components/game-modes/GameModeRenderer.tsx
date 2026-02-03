"use client";

import type {
  GameMode,
  MultipleChoiceInputActions,
  MultipleChoiceInputState,
} from "@/types/game";
import {
  DirectionDistanceGuessing,
  DirectionDistanceReveal,
  DirectionDistanceShowing,
} from "./DirectionDistanceMode";
import {
  ImageToUtmGuessing,
  ImageToUtmReveal,
  ImageToUtmShowing,
} from "./ImageToUtmMode";
import {
  MultipleChoiceGuessing,
  MultipleChoiceReveal,
  MultipleChoiceShowing,
} from "./MultipleChoiceMode";
import type {
  GuessInputActions,
  GuessInputState,
  GuessResult,
  LocationData,
  MapInputActions,
  MapInputState,
  RoundStatus,
} from "./types";
import {
  UtmToLocationGuessing,
  UtmToLocationReveal,
  UtmToLocationShowing,
} from "./UtmToLocationMode";

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
  mapInputState?: MapInputState;
  mapInputActions?: MapInputActions;
  mcInputState?: MultipleChoiceInputState;
  mcInputActions?: MultipleChoiceInputActions;
  /** Round ID for deterministic shuffle in MC mode */
  roundId?: string;
  /** Server-provided shuffled options for MC mode */
  mcShuffledOptions?: string[];
  /** Server-provided correct index for MC mode (only during reveal) */
  mcCorrectIndex?: number;
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
  mapInputState,
  mapInputActions,
  mcInputState,
  mcInputActions,
  roundId,
  mcShuffledOptions,
  mcCorrectIndex,
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
      mapInputState,
      mapInputActions,
      mcInputState,
      mcInputActions,
      roundId,
      mcShuffledOptions,
    );
  }

  if (status === "reveal" || status === "completed") {
    return renderRevealState(
      mode,
      location,
      guessResult,
      roundId,
      mcShuffledOptions,
      mcCorrectIndex,
    );
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
    case "directionDistance":
      return (
        <DirectionDistanceShowing location={location} timeLimit={timeLimit} />
      );
    case "multipleChoice":
      return (
        <MultipleChoiceShowing location={location} timeLimit={timeLimit} />
      );
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
  mapInputState?: MapInputState,
  mapInputActions?: MapInputActions,
  mcInputState?: MultipleChoiceInputState,
  mcInputActions?: MultipleChoiceInputActions,
  roundId?: string,
  mcShuffledOptions?: string[],
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
          mapInputState={mapInputState}
          mapInputActions={mapInputActions}
        />
      );
    case "directionDistance":
      return (
        <DirectionDistanceGuessing
          location={location}
          countdownEndsAt={countdownEndsAt}
          timeLimit={timeLimit}
          hasGuessed={hasGuessed}
          inputState={inputState}
          inputActions={inputActions}
          mapInputState={mapInputState}
          mapInputActions={mapInputActions}
        />
      );
    case "multipleChoice":
      return (
        <MultipleChoiceGuessing
          location={location}
          countdownEndsAt={countdownEndsAt}
          timeLimit={timeLimit}
          hasGuessed={hasGuessed}
          roundId={roundId ?? ""}
          mcShuffledOptions={mcShuffledOptions}
          mcInputState={mcInputState}
          mcInputActions={mcInputActions}
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
  roundId?: string,
  mcShuffledOptions?: string[],
  mcCorrectIndex?: number,
): React.ReactElement | null {
  switch (mode) {
    case "imageToUtm":
      return <ImageToUtmReveal location={location} guessResult={guessResult} />;
    case "utmToLocation":
      return (
        <UtmToLocationReveal location={location} guessResult={guessResult} />
      );
    case "directionDistance":
      return (
        <DirectionDistanceReveal
          location={location}
          guessResult={guessResult}
        />
      );
    case "multipleChoice":
      return (
        <MultipleChoiceReveal
          location={location}
          guessResult={guessResult}
          roundId={roundId ?? ""}
          mcShuffledOptions={mcShuffledOptions}
          mcCorrectIndex={mcCorrectIndex}
        />
      );
    default:
      return null;
  }
}
