"use client";

import type React from "react";
import { useMemo } from "react";
import { CountdownTimer } from "@/components/CountdownTimer";
import { DirectionDistanceDisplay } from "@/components/DirectionDistanceDisplay";
import { GuessSubmittedCard } from "@/components/GuessSubmittedCard";
import { UtmToLocationMap } from "@/components/game-modes/UtmToLocationMap";
import { LocationRevealCard } from "@/components/LocationRevealCard";
import {
  DistanceDisplay,
  LocationSolutionMap,
} from "@/components/LocationSolutionMap";
import { RoundImage } from "@/components/RoundImage";
import { Card, CardContent } from "@/components/ui/card";
import { getCorrectPosition } from "@/lib/location";
import { extractLocationUtm } from "@/lib/utm-helpers";
import { CountdownPreviewCard } from "./CountdownPreviewCard";
import type {
  GameModeGuessingProps,
  GameModeRevealProps,
  GameModeShowingProps,
} from "./types";

/**
 * DirectionDistance showing phase - displays start point image and direction/distance
 */
export function DirectionDistanceShowing({
  location,
  timeLimit,
}: GameModeShowingProps): React.ReactElement | null {
  const imageUrl = location.startPointImageUrls?.[0] ?? location.imageUrls?.[0];
  const bearingDegrees = location.bearingDegrees ?? 0;
  const distanceMeters = location.distanceMeters ?? 0;
  const startPointName = location.startPointName ?? "Startpunkt";

  return (
    <>
      {/* Start point image */}
      {imageUrl && <RoundImage src={imageUrl} size="md" withCard />}

      {/* Start point name */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-1">Von:</p>
        <h3 className="text-xl font-semibold text-secondary">
          {startPointName}
        </h3>
      </div>

      {/* Direction and distance display */}
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <DirectionDistanceDisplay
            bearingDegrees={bearingDegrees}
            distanceMeters={distanceMeters}
            size="md"
          />
        </CardContent>
      </Card>

      {/* Countdown preview */}
      <CountdownPreviewCard timeLimit={timeLimit} />
    </>
  );
}

/**
 * DirectionDistance guessing phase - map with direction overlay
 */
export function DirectionDistanceGuessing({
  location,
  countdownEndsAt,
  timeLimit,
  hasGuessed,
  mapInputState,
  mapInputActions,
}: GameModeGuessingProps): React.ReactElement {
  const { utmZone, utmEasting, utmNorthing } = extractLocationUtm(location);
  const bearingDegrees = location.bearingDegrees ?? 0;
  const distanceMeters = location.distanceMeters ?? 0;
  const startPointName = location.startPointName ?? "Startpunkt";

  if (hasGuessed) {
    return (
      <>
        {/* Direction reminder */}
        <Card className="w-full max-w-md">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Von {startPointName}:
              </span>
              <DirectionDistanceDisplay
                bearingDegrees={bearingDegrees}
                distanceMeters={distanceMeters}
                size="sm"
              />
            </div>
          </CardContent>
        </Card>

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

  // Map mode with direction overlay
  // Note: mapInputState and mapInputActions are always provided by GameModeRenderer
  return (
    <div className="w-full max-w-2xl flex flex-col gap-4">
      {/* Direction info overlay */}
      <Card className="w-full">
        <CardContent className="py-3">
          <div className="flex items-center justify-center gap-4">
            <span className="text-sm text-muted-foreground">
              Von {startPointName}:
            </span>
            <DirectionDistanceDisplay
              bearingDegrees={bearingDegrees}
              distanceMeters={distanceMeters}
              size="sm"
              showLegend={false}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reuse the interactive map */}
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
        className="w-full"
      />
    </div>
  );
}

/**
 * DirectionDistance reveal phase - shows start, correct, and guessed positions
 */
export function DirectionDistanceReveal({
  location,
  guessResult,
}: GameModeRevealProps): React.ReactElement {
  const { utmZone, utmEasting, utmNorthing } = extractLocationUtm(location);

  // Get correct position (destination)
  const correctPosition = useMemo(
    () =>
      getCorrectPosition(location, {
        utmZone,
        utmEasting,
        utmNorthing,
      }),
    [location, utmZone, utmEasting, utmNorthing],
  );

  // Get start position (simple null check, no memoization needed)
  const startPosition =
    location.startPointLatitude != null && location.startPointLongitude != null
      ? {
          lat: location.startPointLatitude,
          lng: location.startPointLongitude,
        }
      : null;

  // Get guessed position
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
        startPosition={startPosition}
        showDistanceLine={!!guessedPosition}
        showUtmGrid
        aria-label="Karte zeigt Startpunkt, Ziel und deine Antwort"
      />

      {guessResult?.distanceMeters != null && (
        <output aria-live="polite">
          <DistanceDisplay distanceMeters={guessResult.distanceMeters} />
        </output>
      )}
    </div>
  );
}
