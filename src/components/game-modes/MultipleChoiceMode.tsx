"use client";

import { useEffect } from "react";
import { CountdownTimer } from "@/components/CountdownTimer";
import { GuessSubmittedCard } from "@/components/GuessSubmittedCard";
import { LocationRevealCard } from "@/components/LocationRevealCard";
import { RoundImage } from "@/components/RoundImage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { CountdownPreviewCard } from "./CountdownPreviewCard";
import type {
  GameModeGuessingProps,
  GameModeRevealProps,
  GameModeShowingProps,
  MultipleChoiceInputActions,
  MultipleChoiceInputState,
} from "./types";

// Extended props for Multiple Choice mode
interface MultipleChoiceGuessingProps
  extends Omit<
    GameModeGuessingProps,
    "inputState" | "inputActions" | "mapInputState" | "mapInputActions"
  > {
  /** Server-provided shuffled options */
  mcShuffledOptions: string[];
  mcInputState?: MultipleChoiceInputState;
  mcInputActions?: MultipleChoiceInputActions;
}

interface MultipleChoiceRevealProps extends GameModeRevealProps {
  /** Server-provided shuffled options */
  mcShuffledOptions: string[];
  /** Server-provided correct answer index */
  mcCorrectIndex: number;
}

/**
 * MultipleChoice showing phase - displays image with countdown
 */
export function MultipleChoiceShowing({
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

/**
 * MultipleChoice guessing phase - image with 4 choice cards
 */
export function MultipleChoiceGuessing({
  location,
  countdownEndsAt,
  timeLimit,
  hasGuessed,
  mcShuffledOptions,
  mcInputState,
  mcInputActions,
}: MultipleChoiceGuessingProps): React.ReactElement {
  const imageUrl = location.imageUrls?.[0];

  // Use server-provided shuffled options (server always provides this)
  const shuffledOptions = mcShuffledOptions;

  // Note: mcInputState and mcInputActions are always provided by GameModeRenderer
  const selectedIndex = mcInputState?.selectedOptionIndex ?? null;
  const isSubmitting = mcInputState?.isSubmitting ?? false;
  const submitError = mcInputState?.submitError ?? null;

  const setSelectedIndex = mcInputActions?.setSelectedOptionIndex ?? (() => {});

  // Keyboard shortcuts (1-4)
  useEffect(() => {
    if (hasGuessed || isSubmitting) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const num = Number.parseInt(e.key, 10);
      if (num >= 1 && num <= 4 && num <= shuffledOptions.length) {
        setSelectedIndex(num - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasGuessed, isSubmitting, shuffledOptions.length, setSelectedIndex]);

  function handleValueChange(value: string): void {
    const index = shuffledOptions.indexOf(value);
    if (index !== -1) {
      setSelectedIndex(index);
    }
  }

  const handleSubmit =
    mcInputActions?.handleSubmit ?? (() => Promise.resolve());

  if (hasGuessed) {
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

        <GuessSubmittedCard />
      </>
    );
  }

  const selectedValue =
    selectedIndex !== null ? shuffledOptions[selectedIndex] : undefined;

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

      <Card className="w-full max-w-2xl">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-center mb-4">
            Welcher Ort ist das?
          </h3>

          {/* Choice Cards using RadioGroup */}
          <RadioGroup
            value={selectedValue}
            onValueChange={handleValueChange}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            disabled={isSubmitting}
          >
            {shuffledOptions.map((option, index) => (
              <FieldLabel key={option} htmlFor={`option-${index}`}>
                <Field
                  orientation="horizontal"
                  className={cn(
                    "cursor-pointer transition-colors",
                    selectedValue === option && "bg-primary/10 border-primary",
                  )}
                >
                  <FieldContent>
                    <FieldTitle className="text-base">
                      <span className="text-muted-foreground font-normal mr-2">
                        {index + 1}.
                      </span>
                      {option}
                    </FieldTitle>
                  </FieldContent>
                  <RadioGroupItem
                    value={option}
                    id={`option-${index}`}
                    disabled={isSubmitting}
                  />
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>

          <p className="text-xs text-center text-muted-foreground mt-3">
            Tasten 1-4 fuer Schnellauswahl
          </p>

          {submitError && (
            <p className="text-sm text-destructive text-center mt-2">
              {submitError}
            </p>
          )}

          <Button
            size="lg"
            className={cn(
              "w-full mt-6 font-bold",
              selectedIndex !== null && !isSubmitting && "submit-ready",
            )}
            disabled={selectedIndex === null || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Wird gesendet..." : "Antwort abgeben"}
          </Button>
        </CardContent>
      </Card>
    </>
  );
}

/**
 * MultipleChoice reveal phase - shows correct answer and whether user was right
 */
export function MultipleChoiceReveal({
  location,
  guessResult,
  mcShuffledOptions,
  mcCorrectIndex,
}: MultipleChoiceRevealProps): React.ReactElement {
  const imageUrl = location.imageUrls?.[0];
  const correctName = location.name ?? "";

  // Use server-provided shuffled options and correct index
  const shuffledOptions = mcShuffledOptions;
  const correctIndex = mcCorrectIndex;

  // Get the user's selection
  const guessedOptionName = guessResult?.guessedOptionName;
  const guessedIndex = guessedOptionName
    ? shuffledOptions.indexOf(guessedOptionName)
    : null;

  const isCorrect = guessedOptionName === correctName;

  return (
    <div className="w-full max-w-2xl flex flex-col gap-4">
      {imageUrl && <RoundImage src={imageUrl} size="md" withCard />}

      <LocationRevealCard locationName={location.name ?? "Unbekannter Ort"}>
        {guessedOptionName && (
          <div className="mt-4 text-center">
            {isCorrect ? (
              <div className="flex items-center justify-center gap-2 text-correct">
                <span className="text-2xl">✓</span>
                <span className="font-semibold">Richtig!</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-destructive">
                  <span className="text-2xl">✗</span>
                  <span className="font-semibold">Leider falsch</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Deine Antwort: {guessedOptionName}
                </p>
              </div>
            )}
          </div>
        )}
      </LocationRevealCard>

      {/* Show all options with correct/wrong highlighting */}
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shuffledOptions.map((option, index) => {
              const isThisCorrect = index === correctIndex;
              const isThisSelected = index === guessedIndex;

              return (
                <div
                  key={option}
                  className={cn(
                    "px-4 py-3 rounded-lg border text-center font-medium transition-colors",
                    isThisCorrect &&
                      "bg-correct/20 border-correct text-correct",
                    isThisSelected &&
                      !isThisCorrect &&
                      "bg-destructive/20 border-destructive text-destructive",
                    !isThisCorrect &&
                      !isThisSelected &&
                      "bg-muted/30 border-muted text-muted-foreground",
                  )}
                >
                  <span className="text-inherit opacity-60 mr-2">
                    {index + 1}.
                  </span>
                  {option}
                  {isThisCorrect && (
                    <span className="ml-2" title="Richtige Antwort">
                      ✓
                    </span>
                  )}
                  {isThisSelected && !isThisCorrect && (
                    <span className="ml-2" title="Deine Antwort">
                      ✗
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
