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
import { extractLocationUtm, parseUtmZone } from "@/lib/utm-helpers";
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

      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground mb-2">Gleich geht&apos;s los!</p>
          <CountdownDisplay seconds={timeLimit} size="lg" />
        </CardContent>
      </Card>
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

      {guessedPosition && (
        <>
          <LocationSolutionMap
            correctPosition={correctPosition}
            guessedPosition={guessedPosition}
            showDistanceLine
            showUtmGrid
          />

          {guessResult?.distanceMeters != null && (
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

/**
 * Get correct position from location, converting from UTM if needed.
 */
function getCorrectPosition(
  location: { latitude?: number; longitude?: number },
  utm: { utmZone: string; utmEasting: number; utmNorthing: number },
): { lat: number; lng: number } {
  if (location.latitude != null && location.longitude != null) {
    return { lat: location.latitude, lng: location.longitude };
  }

  const { zone, hemisphere } = parseUtmZone(utm.utmZone);
  const latLng = utmToLatLng({
    zone,
    hemisphere,
    easting: utm.utmEasting,
    northing: utm.utmNorthing,
  });
  return { lat: latLng.latitude, lng: latLng.longitude };
}
