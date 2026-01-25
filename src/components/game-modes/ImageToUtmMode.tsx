"use client";

import { AnswerComparison } from "@/components/AnswerComparison";
import { CountdownDisplay, CountdownTimer } from "@/components/CountdownTimer";
import { GuessSubmittedCard } from "@/components/GuessSubmittedCard";
import { LocationRevealCard } from "@/components/LocationRevealCard";
import { RoundImage } from "@/components/RoundImage";
import { UtmInput } from "@/components/UtmInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground mb-2">Gleich geht&apos;s los!</p>
          <CountdownDisplay seconds={timeLimit} size="lg" />
        </CardContent>
      </Card>
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

  return (
    <LocationRevealCard locationName={location.name}>
      <AnswerComparison
        guessedEasting={guessResult?.guessedUtmEasting}
        guessedNorthing={guessResult?.guessedUtmNorthing}
        correctEasting={correctEasting}
        correctNorthing={correctNorthing}
      />
    </LocationRevealCard>
  );
}
