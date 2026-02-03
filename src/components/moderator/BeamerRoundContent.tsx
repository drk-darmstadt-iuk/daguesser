"use client";

import { useMemo } from "react";
import { CountdownDisplay, CountdownTimer } from "@/components/CountdownTimer";
import {
  DirectionDistanceCompact,
  DirectionDistanceDisplay,
} from "@/components/DirectionDistanceDisplay";
import { LeaderboardBeamer } from "@/components/Leaderboard";
import { LocationSolutionMap } from "@/components/LocationSolutionMap";
import { RoundImage } from "@/components/RoundImage";
import { UtmDisplay } from "@/components/UtmDisplay";
import { getCorrectPosition } from "@/lib/location";
import { buildShuffledMcOptions } from "@/lib/shuffle";
import { cn } from "@/lib/utils";
import { extractLocationUtm } from "@/lib/utm-helpers";
import { GuessProgress } from "./GuessProgress";
import type {
  GameModeValue,
  LeaderboardEntryData,
  LocationData,
  RoundStatusValue,
} from "./types";

interface RoundGuess {
  teamName: string;
  guessedLatitude?: number;
  guessedLongitude?: number;
  guessedUtmEasting?: number;
  guessedUtmNorthing?: number;
  guessedOptionName?: string;
  score: number;
  distanceMeters: number;
}

interface BeamerRoundContentProps {
  status: RoundStatusValue;
  mode: GameModeValue;
  location: LocationData | undefined;
  timeLimit: number;
  countdownEndsAt?: number;
  guessCount: number;
  totalTeams: number;
  allTeamsGuessed?: boolean;
  leaderboard: LeaderboardEntryData[];
  roundGuesses?: RoundGuess[];
  /** Round ID for deterministic shuffle in MC mode */
  roundId?: string;
  /** Server-provided shuffled options for MC mode */
  mcShuffledOptions?: string[];
  /** Server-provided correct index for MC mode (only during reveal) */
  mcCorrectIndex?: number;
}

export function BeamerRoundContent({
  status,
  mode,
  location,
  timeLimit,
  countdownEndsAt,
  guessCount,
  totalTeams,
  allTeamsGuessed,
  leaderboard,
  roundGuesses,
  roundId,
  mcShuffledOptions,
  mcCorrectIndex,
}: BeamerRoundContentProps): React.ReactElement | null {
  switch (status) {
    case "pending":
      return <BeamerPendingContent />;

    case "showing":
      return (
        <BeamerShowingContent
          mode={mode}
          location={location}
          timeLimit={timeLimit}
        />
      );

    case "guessing":
      return (
        <BeamerGuessingContent
          mode={mode}
          location={location}
          timeLimit={timeLimit}
          countdownEndsAt={countdownEndsAt}
          guessCount={guessCount}
          totalTeams={totalTeams}
          allTeamsGuessed={allTeamsGuessed}
        />
      );

    case "reveal":
    case "completed":
      return (
        <BeamerRevealContent
          mode={mode}
          location={location}
          leaderboard={leaderboard}
          roundGuesses={roundGuesses}
          roundId={roundId}
          mcShuffledOptions={mcShuffledOptions}
          mcCorrectIndex={mcCorrectIndex}
        />
      );

    default:
      return null;
  }
}

function BeamerPendingContent(): React.ReactElement {
  return (
    <h2 className="text-4xl font-bold text-muted-foreground">
      Naechste Runde...
    </h2>
  );
}

interface BeamerShowingContentProps {
  mode: GameModeValue;
  location: LocationData | undefined;
  timeLimit: number;
}

function BeamerShowingContent({
  mode,
  location,
  timeLimit,
}: BeamerShowingContentProps): React.ReactElement {
  const utm = extractLocationUtm(location);

  return (
    <>
      {mode === "imageToUtm" && location?.imageUrls?.[0] && (
        <RoundImage src={location.imageUrls[0]} size="xl" alt="Ort" />
      )}

      {mode === "utmToLocation" && (
        <UtmDisplay
          utmZone={utm.utmZone}
          easting={utm.utmEasting}
          northing={utm.utmNorthing}
          size="xl"
          className="mx-auto"
        />
      )}

      {mode === "directionDistance" && (
        <div className="flex flex-col items-center gap-6">
          {location?.startPointImageUrls?.[0] && (
            <RoundImage
              src={location.startPointImageUrls[0]}
              size="lg"
              alt={location.startPointName ?? "Startpunkt"}
            />
          )}
          <div className="text-center">
            <p className="text-2xl text-muted-foreground mb-2">
              Von: {location?.startPointName ?? "Startpunkt"}
            </p>
            <DirectionDistanceDisplay
              bearingDegrees={location?.bearingDegrees ?? 0}
              distanceMeters={location?.distanceMeters ?? 0}
              size="lg"
            />
          </div>
        </div>
      )}

      {mode === "multipleChoice" && location?.imageUrls?.[0] && (
        <RoundImage src={location.imageUrls[0]} size="xl" alt="Ort" />
      )}

      <div className="mt-8">
        <CountdownDisplay seconds={timeLimit} size="xl" />
        <p className="text-xl text-muted-foreground mt-2">
          Gleich geht&apos;s los!
        </p>
      </div>
    </>
  );
}

interface BeamerGuessingContentProps {
  mode: GameModeValue;
  location: LocationData | undefined;
  timeLimit: number;
  countdownEndsAt?: number;
  guessCount: number;
  totalTeams: number;
  allTeamsGuessed?: boolean;
}

function BeamerGuessingContent({
  mode,
  location,
  timeLimit,
  countdownEndsAt,
  guessCount,
  totalTeams,
  allTeamsGuessed,
}: BeamerGuessingContentProps): React.ReactElement {
  const utm = extractLocationUtm(location);

  return (
    <>
      {mode === "imageToUtm" && location?.imageUrls?.[0] && (
        <div className="mb-8">
          <RoundImage src={location.imageUrls[0]} size="md" alt="Ort" />
        </div>
      )}

      {mode === "utmToLocation" && (
        <div className="mb-8">
          <UtmDisplay
            utmZone={utm.utmZone}
            easting={utm.utmEasting}
            northing={utm.utmNorthing}
            size="lg"
            className="mx-auto"
          />
        </div>
      )}

      {mode === "directionDistance" && (
        <div className="mb-8 flex flex-col items-center gap-4">
          {location?.startPointImageUrls?.[0] && (
            <RoundImage
              src={location.startPointImageUrls[0]}
              size="sm"
              alt={location.startPointName ?? "Startpunkt"}
            />
          )}
          <div className="text-center">
            <p className="text-lg text-muted-foreground mb-2">
              Von: {location?.startPointName ?? "Startpunkt"}
            </p>
            <DirectionDistanceCompact
              bearingDegrees={location?.bearingDegrees ?? 0}
              distanceMeters={location?.distanceMeters ?? 0}
            />
          </div>
        </div>
      )}

      {mode === "multipleChoice" && location?.imageUrls?.[0] && (
        <div className="mb-8">
          <RoundImage src={location.imageUrls[0]} size="md" alt="Ort" />
        </div>
      )}

      {countdownEndsAt && (
        <CountdownTimer
          endsAt={countdownEndsAt}
          totalSeconds={timeLimit}
          size="xl"
          showMs
        />
      )}

      <GuessProgress
        guessCount={guessCount}
        totalTeams={totalTeams}
        allTeamsGuessed={allTeamsGuessed}
        size="lg"
      />
    </>
  );
}

interface BeamerRevealContentProps {
  mode: GameModeValue;
  location: LocationData | undefined;
  leaderboard: LeaderboardEntryData[];
  roundGuesses?: RoundGuess[];
  roundId?: string;
  mcShuffledOptions?: string[];
  mcCorrectIndex?: number;
}

function BeamerRevealContent({
  mode,
  location,
  leaderboard,
  roundGuesses,
  roundId,
  mcShuffledOptions,
  mcCorrectIndex,
}: BeamerRevealContentProps): React.ReactElement {
  const utm = extractLocationUtm(location);

  // Get correct position for map-based modes
  const correctPosition =
    mode === "utmToLocation" || mode === "directionDistance"
      ? getCorrectPosition(location, utm)
      : null;

  // Get start position for direction distance mode
  const startPosition =
    mode === "directionDistance" &&
    location?.startPointLatitude != null &&
    location?.startPointLongitude != null
      ? { lat: location.startPointLatitude, lng: location.startPointLongitude }
      : undefined;

  // Build team guesses for map (filter out guesses without coordinates)
  const teamGuesses =
    (mode === "utmToLocation" || mode === "directionDistance") && roundGuesses
      ? roundGuesses
          .filter(
            (
              g,
            ): g is RoundGuess & {
              guessedLatitude: number;
              guessedLongitude: number;
            } => g.guessedLatitude != null && g.guessedLongitude != null,
          )
          .map((g) => ({
            teamName: g.teamName,
            position: { lat: g.guessedLatitude, lng: g.guessedLongitude },
            score: g.score,
            distanceMeters: g.distanceMeters,
          }))
      : [];

  // Use server-provided shuffle if available, otherwise fall back to client-side computation
  const locationName = location?.name ?? "";
  const shuffledOptions = useMemo(() => {
    if (mode !== "multipleChoice") {
      return [];
    }
    if (mcShuffledOptions && mcShuffledOptions.length > 0) {
      return mcShuffledOptions;
    }
    // Fallback: compute client-side (only for old rounds)
    const mcOptions = location?.mcOptions;
    if (!mcOptions || !roundId) {
      return [];
    }
    return buildShuffledMcOptions(locationName, mcOptions, roundId);
  }, [mode, mcShuffledOptions, locationName, location?.mcOptions, roundId]);

  // Use server-provided correct index if available, otherwise find it
  const correctIndex =
    mcCorrectIndex !== undefined
      ? mcCorrectIndex
      : shuffledOptions.indexOf(locationName);

  return (
    <>
      <h2 className="text-4xl font-bold text-correct">Richtige Antwort</h2>
      <h3 className="text-5xl font-bold text-secondary mt-4">
        {location?.name ?? "Unbekannt"}
      </h3>

      {/* Map display for utmToLocation and directionDistance */}
      {(mode === "utmToLocation" || mode === "directionDistance") &&
      correctPosition ? (
        <div className="mt-8 w-full max-w-4xl mx-auto">
          <LocationSolutionMap
            correctPosition={correctPosition}
            startPosition={startPosition}
            teamGuesses={teamGuesses}
            showDistanceLine={false}
            showUtmGrid
            className="h-[400px]"
          />
        </div>
      ) : mode === "multipleChoice" ? (
        // Multiple choice options display
        <div className="mt-8 grid grid-cols-2 gap-4 max-w-3xl mx-auto">
          {shuffledOptions.map((option, index) => {
            const isCorrect = index === correctIndex;
            return (
              <div
                key={option}
                className={cn(
                  "px-6 py-4 rounded-lg border-2 text-center font-semibold text-xl transition-colors",
                  isCorrect
                    ? "bg-correct/20 border-correct text-correct"
                    : "bg-muted/30 border-muted text-muted-foreground",
                )}
              >
                <span className="opacity-60 mr-2">{index + 1}.</span>
                {option}
                {isCorrect && <span className="ml-2">✓</span>}
              </div>
            );
          })}
        </div>
      ) : (
        // Default: UTM display for imageToUtm
        <UtmDisplay
          utmZone={utm.utmZone}
          easting={utm.utmEasting}
          northing={utm.utmNorthing}
          size="lg"
          highlightLast3={false}
          className="mx-auto mt-8"
        />
      )}

      {leaderboard.length > 0 && (
        <div className="mt-12 max-w-2xl mx-auto">
          <LeaderboardBeamer
            entries={leaderboard.slice(0, 5)}
            showRoundScores
          />
        </div>
      )}
    </>
  );
}
