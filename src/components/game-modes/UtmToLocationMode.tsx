"use client";

import { CountdownTimer } from "@/components/CountdownTimer";
import { GuessSubmittedCard } from "@/components/GuessSubmittedCard";
import { UtmToLocationMap } from "@/components/game-modes/UtmToLocationMap";
import { LocationRevealCard } from "@/components/LocationRevealCard";
import {
  DistanceDisplay,
  LocationSolutionMap,
} from "@/components/LocationSolutionMap";
import { UtmDisplay } from "@/components/UtmDisplay";
import { getCorrectPosition } from "@/lib/location";
import { extractLocationUtm } from "@/lib/utm-helpers";
import { CountdownPreviewCard } from "./CountdownPreviewCard";
import type {
  GameModeGuessingProps,
  GameModeRevealProps,
  GameModeShowingProps,
} from "./types";

export function UtmToLocationShowing({
  location,
  timeLimit,
}: GameModeShowingProps): React.ReactElement {
  const { utmZone, utmEasting, utmNorthing } = extractLocationUtm(location);

  return (
    <>
      <UtmDisplay
        utmZone={utmZone}
        easting={utmEasting}
        northing={utmNorthing}
        size="lg"
      />
      <CountdownPreviewCard timeLimit={timeLimit} />
    </>
  );
}

export function UtmToLocationGuessing({
  location,
  countdownEndsAt,
  timeLimit,
  hasGuessed,
  mapInputState,
  mapInputActions,
}: GameModeGuessingProps): React.ReactElement {
  const { utmZone, utmEasting, utmNorthing } = extractLocationUtm(location);

  if (hasGuessed) {
    return (
      <>
        <UtmDisplay
          utmZone={utmZone}
          easting={utmEasting}
          northing={utmNorthing}
          size="md"
        />

        {countdownEndsAt && (
          <CountdownTimer
            endsAt={countdownEndsAt}
            totalSeconds={timeLimit}
            size="lg"
          />
        )}

        <GuessSubmittedCard />
      </>
    );
  }

  // Map mode - full screen guessing experience
  // Note: mapInputState and mapInputActions are always provided by GameModeRenderer
  return (
    <UtmToLocationMap
      targetUtm={{
        zone: utmZone,
        easting: utmEasting,
        northing: utmNorthing,
      }}
      countdownEndsAt={countdownEndsAt}
      timeLimit={timeLimit}
      isSubmitting={mapInputState?.isSubmitting ?? false}
      submitError={mapInputState?.submitError ?? null}
      onPositionChange={mapInputActions?.setGuessedPosition ?? (() => {})}
      onSubmit={mapInputActions?.handleSubmit ?? (() => Promise.resolve())}
      className="w-full max-w-2xl"
    />
  );
}

export function UtmToLocationReveal({
  location,
  guessResult,
}: GameModeRevealProps): React.ReactElement {
  const { utmZone, utmEasting, utmNorthing } = extractLocationUtm(location);

  // Get correct position from location or convert from UTM
  const correctPosition = getCorrectPosition(location, {
    utmZone,
    utmEasting,
    utmNorthing,
  });

  // Get guessed position from result
  const guessedPosition =
    guessResult?.guessedLatitude != null &&
    guessResult?.guessedLongitude != null
      ? { lat: guessResult.guessedLatitude, lng: guessResult.guessedLongitude }
      : null;

  return (
    <div className="w-full max-w-2xl flex flex-col gap-4">
      <LocationRevealCard locationName={location.name} />

      <LocationSolutionMap
        correctPosition={correctPosition}
        guessedPosition={guessedPosition}
        showDistanceLine={!!guessedPosition}
        showUtmGrid
      />

      {guessResult?.distanceMeters != null && guessedPosition && (
        <DistanceDisplay distanceMeters={guessResult.distanceMeters} />
      )}
    </div>
  );
}
