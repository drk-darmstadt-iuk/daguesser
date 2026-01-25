"use client";

import { CountdownDisplay, CountdownTimer } from "@/components/CountdownTimer";
import { UtmInput } from "@/components/UtmInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatUtmMeters } from "@/lib/utm-helpers";
import type {
  GameModeGuessingProps,
  GameModeRevealProps,
  GameModeShowingProps,
} from "./types";

interface ImageToUtmShowingProps extends GameModeShowingProps {}

export function ImageToUtmShowing({
  location,
  timeLimit,
}: ImageToUtmShowingProps): React.ReactElement | null {
  const imageUrl = location.imageUrls?.[0];

  if (!imageUrl) {
    return null;
  }

  return (
    <>
      <Card className="w-full max-w-2xl overflow-hidden">
        <img
          src={imageUrl}
          alt="Zu erratender Ort"
          className="w-full h-auto max-h-[50vh] object-contain"
        />
      </Card>

      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground mb-2">Gleich geht&apos;s los!</p>
          <CountdownDisplay seconds={timeLimit} size="lg" />
        </CardContent>
      </Card>
    </>
  );
}

interface ImageToUtmGuessingProps extends GameModeGuessingProps {}

export function ImageToUtmGuessing({
  location,
  countdownEndsAt,
  timeLimit,
  hasGuessed,
  inputState,
  inputActions,
}: ImageToUtmGuessingProps): React.ReactElement | null {
  const imageUrl = location.imageUrls?.[0];
  const { eastingInput, northingInput, isSubmitting, submitError } = inputState;
  const { setEastingInput, setNorthingInput, handleSubmit } = inputActions;

  const isInputComplete =
    eastingInput.length === 3 && northingInput.length === 3;

  return (
    <>
      {imageUrl && (
        <Card className="w-full max-w-2xl overflow-hidden">
          <img
            src={imageUrl}
            alt="Zu erratender Ort"
            className="w-full h-auto max-h-[40vh] object-contain"
          />
        </Card>
      )}

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

interface ImageToUtmRevealProps extends GameModeRevealProps {}

export function ImageToUtmReveal({
  location,
  guessResult,
}: ImageToUtmRevealProps): React.ReactElement {
  const correctEasting = location.utmEasting ?? 0;
  const correctNorthing = location.utmNorthing ?? 0;

  return (
    <Card className="w-full max-w-md bg-card/80">
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-4">
          <AnswerColumn
            label="Deine Antwort"
            easting={guessResult?.guessedUtmEasting}
            northing={guessResult?.guessedUtmNorthing}
            isCorrect={false}
          />
          <AnswerColumn
            label="Richtig"
            easting={correctEasting}
            northing={correctNorthing}
            isCorrect={true}
          />
        </div>

        <div className="mt-4 pt-4 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">Ort</p>
          <h3 className="text-lg font-bold text-secondary">{location.name}</h3>
        </div>
      </CardContent>
    </Card>
  );
}

function GuessSubmittedCard(): React.ReactElement {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-correct/20 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-correct"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            aria-label="Haekchen"
            role="img"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="font-semibold text-correct">Antwort abgegeben!</p>
        <p className="text-sm text-muted-foreground mt-2">
          Warte auf die Aufloesung...
        </p>
      </CardContent>
    </Card>
  );
}

interface AnswerColumnProps {
  label: string;
  easting: number | undefined;
  northing: number | undefined;
  isCorrect: boolean;
}

function AnswerColumn({
  label,
  easting,
  northing,
  isCorrect,
}: AnswerColumnProps): React.ReactElement {
  const hasAnswer = easting !== undefined && northing !== undefined;

  return (
    <div className="text-center">
      <p className="text-sm text-muted-foreground mb-2">{label}</p>
      {hasAnswer ? (
        <div className="font-mono text-lg">
          <div className="text-muted-foreground">
            E{" "}
            <span
              className={
                isCorrect ? "text-correct font-bold" : "text-foreground"
              }
            >
              {formatUtmMeters(easting)}
            </span>
          </div>
          <div className="text-muted-foreground">
            N{" "}
            <span
              className={
                isCorrect ? "text-correct font-bold" : "text-foreground"
              }
            >
              {formatUtmMeters(northing)}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">Keine Antwort</p>
      )}
    </div>
  );
}
