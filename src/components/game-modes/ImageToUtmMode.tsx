"use client";

import { useMemo } from "react";
import { AnswerComparison } from "@/components/AnswerComparison";
import { CountdownTimer } from "@/components/CountdownTimer";
import { GuessSubmittedCard } from "@/components/GuessSubmittedCard";
import { LocationRevealCard } from "@/components/LocationRevealCard";
import {
  DistanceDisplay,
  LocationSolutionMap,
} from "@/components/LocationSolutionMap";
import { RoundImage } from "@/components/RoundImage";
import { UtmInput } from "@/components/UtmInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCorrectPosition, getGuessedPosition } from "@/lib/location";
import { extractLocationUtm } from "@/lib/utm-helpers";
import { CountdownPreviewCard } from "./CountdownPreviewCard";
import type {
  GameModeGuessingProps,
  GameModeRevealProps,
  GameModeShowingProps,
} from "./types";

export function ImageToUtmShowing({
  location,
  timeLimit,
}: GameModeShowingProps): React.ReactElement | null {
  const imageUrl = location.imageUrls?.[0];

  if (!imageUrl) {
    return null;
  }

  return (
    <>
      <RoundImage src={imageUrl} size="lg" withCard />
      <CountdownPreviewCard timeLimit={timeLimit} />
    </>
  );
}

export function ImageToUtmGuessing({
  location,
  countdownEndsAt,
  timeLimit,
  hasGuessed,
  inputState,
  inputActions,
}: GameModeGuessingProps): React.ReactElement | null {
  const imageUrl = location.imageUrls?.[0];
  const { eastingInput, northingInput, isSubmitting, submitError } = inputState;
  const { setEastingInput, setNorthingInput, handleSubmit } = inputActions;

  const isInputComplete =
    eastingInput.length === 3 && northingInput.length === 3;

  return (
    <>
      {imageUrl && <RoundImage src={imageUrl} size="md" withCard />}

      {countdownEndsAt && (
        <CountdownTimer
          endsAt={countdownEndsAt}
          totalSeconds={timeLimit}
          size="lg"
        />
      )}

      {hasGuessed ? (
        <GuessSubmittedCard />
      ) : (
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <UtmInput
              utmZone={location.utmZone ?? "32U"}
              eastingValue={eastingInput}
              northingValue={northingInput}
              onEastingChange={setEastingInput}
              onNorthingChange={setNorthingInput}
              disabled={isSubmitting}
              error={submitError ?? undefined}
              size="lg"
            />

            <Button
              size="lg"
              className="w-full mt-6"
              onClick={handleSubmit}
              disabled={!isInputComplete || isSubmitting}
            >
              {isSubmitting ? "Wird gesendet..." : "Antwort abgeben"}
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}

export function ImageToUtmReveal({
  location,
  guessResult,
}: GameModeRevealProps): React.ReactElement {
  const correctEasting = location.utmEasting ?? 0;
  const correctNorthing = location.utmNorthing ?? 0;

  // Extract UTM coordinates for position conversion
  const { utmZone, utmEasting, utmNorthing } = extractLocationUtm(location);

  // Get correct position for map display
  const correctPosition = useMemo(
    () =>
      getCorrectPosition(location, {
        utmZone,
        utmEasting,
        utmNorthing,
      }),
    [location, utmZone, utmEasting, utmNorthing],
  );

  // Get guessed position from UTM coordinates
  const guessedPosition = useMemo(
    () =>
      getGuessedPosition(
        guessResult?.guessedUtmEasting,
        guessResult?.guessedUtmNorthing,
        utmZone,
      ),
    [guessResult?.guessedUtmEasting, guessResult?.guessedUtmNorthing, utmZone],
  );

  return (
    <div className="w-full max-w-2xl flex flex-col gap-4">
      <LocationRevealCard locationName={location.name}>
        <AnswerComparison
          guessedEasting={guessResult?.guessedUtmEasting}
          guessedNorthing={guessResult?.guessedUtmNorthing}
          correctEasting={correctEasting}
          correctNorthing={correctNorthing}
        />
      </LocationRevealCard>

      <LocationSolutionMap
        correctPosition={correctPosition}
        guessedPosition={guessedPosition}
        showDistanceLine={!!guessedPosition}
        showUtmGrid
        className="map-height-supplementary"
        aria-label="Karte zeigt deine Antwort und die korrekte Position"
      />

      {guessResult?.distanceMeters != null && (
        <output aria-live="polite">
          <DistanceDisplay distanceMeters={guessResult.distanceMeters} />
        </output>
      )}
    </div>
  );
}
