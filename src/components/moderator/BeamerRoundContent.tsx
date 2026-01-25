"use client";

import { CountdownDisplay, CountdownTimer } from "@/components/CountdownTimer";
import { LeaderboardBeamer } from "@/components/Leaderboard";
import { LocationSolutionMap } from "@/components/LocationSolutionMap";
import { RoundImage } from "@/components/RoundImage";
import { UtmDisplay } from "@/components/UtmDisplay";
import { utmToLatLng } from "@/lib/utm";
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
}: BeamerRoundContentProps): React.ReactElement | null {
  if (status === "pending") {
    return <BeamerPendingContent />;
  }

  if (status === "showing") {
    return (
      <BeamerShowingContent
        mode={mode}
        location={location}
        timeLimit={timeLimit}
      />
    );
  }

  if (status === "guessing") {
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
  }

  if (status === "reveal" || status === "completed") {
    return (
      <BeamerRevealContent
        mode={mode}
        location={location}
        leaderboard={leaderboard}
        roundGuesses={roundGuesses}
      />
    );
  }

  return null;
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
}

function BeamerRevealContent({
  mode,
  location,
  leaderboard,
  roundGuesses,
}: BeamerRevealContentProps): React.ReactElement {
  const utm = extractLocationUtm(location);

  // Get correct position for utmToLocation mode
  let correctPosition: { lat: number; lng: number } | null = null;
  if (mode === "utmToLocation") {
    if (location?.latitude !== undefined && location?.longitude !== undefined) {
      correctPosition = { lat: location.latitude, lng: location.longitude };
    } else {
      // Convert from UTM
      const zone = Number.parseInt(utm.utmZone.slice(0, -1), 10);
      const hemisphere = utm.utmZone.slice(-1).toUpperCase() >= "N" ? "N" : "S";
      const latLng = utmToLatLng({
        zone,
        hemisphere: hemisphere as "N" | "S",
        easting: utm.utmEasting,
        northing: utm.utmNorthing,
      });
      correctPosition = { lat: latLng.latitude, lng: latLng.longitude };
    }
  }

  // Build team guesses for map
  const teamGuesses =
    mode === "utmToLocation" && roundGuesses
      ? roundGuesses
          .filter(
            (g) =>
              g.guessedLatitude !== undefined &&
              g.guessedLongitude !== undefined,
          )
          .map((g) => ({
            teamName: g.teamName,
            position: {
              lat: g.guessedLatitude!,
              lng: g.guessedLongitude!,
            },
            score: g.score,
            distanceMeters: g.distanceMeters,
          }))
      : [];

  return (
    <>
      <h2 className="text-4xl font-bold text-correct">Richtige Antwort</h2>
      <h3 className="text-5xl font-bold text-secondary mt-4">
        {location?.name ?? "Unbekannt"}
      </h3>

      {mode === "utmToLocation" && correctPosition ? (
        <div className="mt-8 w-full max-w-4xl mx-auto">
          <LocationSolutionMap
            correctPosition={correctPosition}
            teamGuesses={teamGuesses}
            showDistanceLine={false}
            showUtmGrid
            className="h-[400px]"
          />
        </div>
      ) : (
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
