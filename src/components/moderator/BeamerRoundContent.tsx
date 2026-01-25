"use client";

import { CountdownDisplay, CountdownTimer } from "@/components/CountdownTimer";
import { LeaderboardBeamer } from "@/components/Leaderboard";
import { UtmDisplay } from "@/components/UtmDisplay";
import { extractLocationUtm } from "@/lib/utm-helpers";
import { GuessProgress } from "./GuessProgress";
import type {
  GameModeValue,
  LeaderboardEntryData,
  LocationData,
  RoundStatusValue,
} from "./types";

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
      <BeamerRevealContent location={location} leaderboard={leaderboard} />
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
        <div className="flex justify-center">
          <img
            src={location.imageUrls[0]}
            alt="Ort"
            className="max-h-[60vh] rounded-xl shadow-2xl"
          />
        </div>
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
        <div className="flex justify-center mb-8">
          <img
            src={location.imageUrls[0]}
            alt="Ort"
            className="max-h-[40vh] rounded-xl shadow-2xl"
          />
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
  location: LocationData | undefined;
  leaderboard: LeaderboardEntryData[];
}

function BeamerRevealContent({
  location,
  leaderboard,
}: BeamerRevealContentProps): React.ReactElement {
  const utm = extractLocationUtm(location);

  return (
    <>
      <h2 className="text-4xl font-bold text-correct">Richtige Antwort</h2>
      <h3 className="text-5xl font-bold text-secondary mt-4">
        {location?.name ?? "Unbekannt"}
      </h3>
      <UtmDisplay
        utmZone={utm.utmZone}
        easting={utm.utmEasting}
        northing={utm.utmNorthing}
        size="lg"
        highlightLast3={false}
        className="mx-auto mt-8"
      />

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
