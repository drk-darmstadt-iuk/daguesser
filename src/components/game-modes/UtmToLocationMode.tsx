"use client";

import { CountdownDisplay, CountdownTimer } from "@/components/CountdownTimer";
import { GuessSubmittedCard } from "@/components/GuessSubmittedCard";
import { UtmToLocationMap } from "@/components/game-modes/UtmToLocationMap";
import { LocationRevealCard } from "@/components/LocationRevealCard";
import {
  DistanceDisplay,
  LocationSolutionMap,
} from "@/components/LocationSolutionMap";
import { UtmDisplay } from "@/components/UtmDisplay";
import { Card, CardContent } from "@/components/ui/card";
import { utmToLatLng } from "@/lib/utm";
import type {
  GameModeGuessingProps,
  GameModeRevealProps,
  GameModeShowingProps,
} from "./types";

interface UtmToLocationShowingProps extends GameModeShowingProps {}

export function UtmToLocationShowing({
  location,
  timeLimit,
}: UtmToLocationShowingProps): React.ReactElement {
  const utmZone = location.utmZone ?? "32U";
  const utmEasting = location.utmEasting ?? 0;
  const utmNorthing = location.utmNorthing ?? 0;

  return (
    <>
      <UtmDisplay
        utmZone={utmZone}
        easting={utmEasting}
        northing={utmNorthing}
        size="lg"
      />

      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground mb-2">Gleich geht&apos;s los!</p>
          <CountdownDisplay seconds={timeLimit} size="lg" />
        </CardContent>
      </Card>
    </>
  );
}

interface UtmToLocationGuessingProps extends GameModeGuessingProps {}

export function UtmToLocationGuessing({
  location,
  countdownEndsAt,
  timeLimit,
  hasGuessed,
  mapInputState,
  mapInputActions,
}: UtmToLocationGuessingProps): React.ReactElement {
  const utmZone = location.utmZone ?? "32U";
  const utmEasting = location.utmEasting ?? 0;
  const utmNorthing = location.utmNorthing ?? 0;

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
  if (mapInputState && mapInputActions) {
    return (
      <UtmToLocationMap
        targetUtm={{
          zone: utmZone,
          easting: utmEasting,
          northing: utmNorthing,
        }}
        countdownEndsAt={countdownEndsAt}
        timeLimit={timeLimit}
        isSubmitting={mapInputState.isSubmitting}
        submitError={mapInputState.submitError}
        onPositionChange={mapInputActions.setGuessedPosition}
        onSubmit={mapInputActions.handleSubmit}
        className="w-full max-w-2xl"
      />
    );
  }

  // Fallback if map state is not provided
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

      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-muted-foreground">
              Karten-Modus wird geladen...
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

interface UtmToLocationRevealProps extends GameModeRevealProps {}

export function UtmToLocationReveal({
  location,
  guessResult,
}: UtmToLocationRevealProps): React.ReactElement {
  const utmZone = location.utmZone ?? "32U";
  const utmEasting = location.utmEasting ?? 0;
  const utmNorthing = location.utmNorthing ?? 0;

  // Get correct position from location
  let correctPosition: { lat: number; lng: number };
  if (location.latitude !== undefined && location.longitude !== undefined) {
    correctPosition = { lat: location.latitude, lng: location.longitude };
  } else {
    // Convert from UTM if lat/lng not available
    const zone = Number.parseInt(utmZone.slice(0, -1), 10);
    const hemisphere = utmZone.slice(-1).toUpperCase() >= "N" ? "N" : "S";
    const latLng = utmToLatLng({
      zone,
      hemisphere: hemisphere as "N" | "S",
      easting: utmEasting,
      northing: utmNorthing,
    });
    correctPosition = { lat: latLng.latitude, lng: latLng.longitude };
  }

  // Get guessed position from result
  let guessedPosition: { lat: number; lng: number } | null = null;
  if (
    guessResult?.guessedLatitude !== undefined &&
    guessResult?.guessedLongitude !== undefined
  ) {
    guessedPosition = {
      lat: guessResult.guessedLatitude,
      lng: guessResult.guessedLongitude,
    };
  }

  return (
    <div className="w-full max-w-2xl flex flex-col gap-4">
      <LocationRevealCard locationName={location.name} />

      {guessedPosition && (
        <>
          <LocationSolutionMap
            correctPosition={correctPosition}
            guessedPosition={guessedPosition}
            distanceMeters={guessResult?.distanceMeters ?? undefined}
            showDistanceLine
            showUtmGrid
          />

          {guessResult?.distanceMeters !== undefined &&
            guessResult.distanceMeters !== null && (
              <DistanceDisplay distanceMeters={guessResult.distanceMeters} />
            )}
        </>
      )}

      {!guessedPosition && (
        <LocationSolutionMap
          correctPosition={correctPosition}
          showDistanceLine={false}
          showUtmGrid
        />
      )}
    </div>
  );
}
