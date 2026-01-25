"use client";

import { formatUtmMeters } from "@/lib/utm-helpers";

interface AnswerColumnProps {
  label: string;
  easting: number | undefined;
  northing: number | undefined;
  isCorrect: boolean;
}

/**
 * Displays a single UTM coordinate answer in a column layout.
 */
export function AnswerColumn({
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

interface AnswerComparisonProps {
  /** Player's guessed easting coordinate */
  guessedEasting?: number;
  /** Player's guessed northing coordinate */
  guessedNorthing?: number;
  /** Correct easting coordinate */
  correctEasting: number;
  /** Correct northing coordinate */
  correctNorthing: number;
}

/**
 * Two-column display comparing player's answer with correct answer.
 * Used in the reveal phase for imageToUtm game mode.
 */
export function AnswerComparison({
  guessedEasting,
  guessedNorthing,
  correctEasting,
  correctNorthing,
}: AnswerComparisonProps): React.ReactElement {
  return (
    <div className="grid grid-cols-2 gap-4">
      <AnswerColumn
        label="Deine Antwort"
        easting={guessedEasting}
        northing={guessedNorthing}
        isCorrect={false}
      />
      <AnswerColumn
        label="Richtig"
        easting={correctEasting}
        northing={correctNorthing}
        isCorrect={true}
      />
    </div>
  );
}
