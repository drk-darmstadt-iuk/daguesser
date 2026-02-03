"use client";

import { useMutation, useQuery } from "convex/react";
import { Pause } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { GameHeader } from "@/components/GameHeader";
import type { GuessResult, LocationData } from "@/components/game-modes";
import { GameModeRenderer } from "@/components/game-modes";
import { LeaderboardCompact } from "@/components/Leaderboard";
import { RoundScoreResult } from "@/components/TeamScoreCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { LeaderboardEntry } from "@/convex/leaderboard";
import { getDistanceRating } from "@/lib/scoring";
import { shuffleWithSeed } from "@/lib/shuffle";
import {
  calculateFullUtm,
  DARMSTADT_DEFAULTS,
  extractLocationUtm,
  isUtmInputComplete,
} from "@/lib/utm-helpers";

interface TeamGameProps {
  params: Promise<{ joinCode: string }>;
}

export default function TeamGame({
  params,
}: TeamGameProps): React.ReactElement | null {
  const { joinCode } = use(params);
  const router = useRouter();

  const [eastingInput, setEastingInput] = useState("");
  const [northingInput, setNorthingInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Map mode state (for utmToLocation and directionDistance)
  const [guessedPosition, setGuessedPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Multiple choice mode state
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(
    null,
  );

  const gameByCode = useQuery(api.games.getByJoinCode, {
    joinCode: joinCode.toUpperCase(),
  });

  const game = useQuery(
    api.games.get,
    gameByCode?._id ? { gameId: gameByCode._id } : "skip",
  );

  const myTeam = useQuery(
    api.teams.getMyTeam,
    game?._id ? { gameId: game._id } : "skip",
  );

  const currentRound = useQuery(
    api.rounds.getCurrent,
    game?._id ? { gameId: game._id } : "skip",
  );

  const myGuess = useQuery(
    api.guesses.getMyGuess,
    currentRound?._id ? { roundId: currentRound._id } : "skip",
  );

  const roundGuesses = useQuery(
    api.guesses.getForRound,
    currentRound?._id &&
      (currentRound.status === "reveal" || currentRound.status === "completed")
      ? { roundId: currentRound._id }
      : "skip",
  );

  const leaderboard = useQuery(
    api.leaderboard.get,
    game?._id ? { gameId: game._id } : "skip",
  );

  const submitGuess = useMutation(api.guesses.submit);

  // biome-ignore lint/correctness/useExhaustiveDependencies: setters are stable
  useEffect(() => {
    setEastingInput("");
    setNorthingInput("");
    setSubmitError(null);
    setGuessedPosition(null);
    setSelectedOptionIndex(null);
  }, [currentRound?._id]);

  useEffect(() => {
    if (game && myTeam === null) {
      router.push(`/play/${joinCode}`);
    }
  }, [game, myTeam, router, joinCode]);

  async function handleSubmit(): Promise<void> {
    if (!currentRound?._id) return;

    // Validation based on mode
    if (currentRound.mode === "imageToUtm") {
      if (!isUtmInputComplete(eastingInput, northingInput)) {
        setSubmitError(
          "Bitte vollstaendige Koordinaten eingeben (je 3 Ziffern)",
        );
        return;
      }
    }

    if (
      currentRound.mode === "utmToLocation" ||
      currentRound.mode === "directionDistance"
    ) {
      if (!guessedPosition) {
        setSubmitError("Bitte eine Position auf der Karte auswaehlen");
        return;
      }
    }

    if (currentRound.mode === "multipleChoice") {
      if (selectedOptionIndex === null) {
        setSubmitError("Bitte eine Antwort auswaehlen");
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (currentRound.mode === "imageToUtm") {
        const baseEasting =
          currentRound.location?.utmEasting ?? DARMSTADT_DEFAULTS.baseEasting;
        const baseNorthing =
          currentRound.location?.utmNorthing ?? DARMSTADT_DEFAULTS.baseNorthing;

        const fullEasting = calculateFullUtm(baseEasting, eastingInput);
        const fullNorthing = calculateFullUtm(baseNorthing, northingInput);

        await submitGuess({
          roundId: currentRound._id as Id<"rounds">,
          utmEasting: fullEasting,
          utmNorthing: fullNorthing,
        });
      } else if (
        (currentRound.mode === "utmToLocation" ||
          currentRound.mode === "directionDistance") &&
        guessedPosition
      ) {
        await submitGuess({
          roundId: currentRound._id as Id<"rounds">,
          latitude: guessedPosition.lat,
          longitude: guessedPosition.lng,
        });
      } else if (
        currentRound.mode === "multipleChoice" &&
        selectedOptionIndex !== null
      ) {
        const mcOptions = currentRound.location?.mcOptions ?? [];
        const allOptions = [currentRound.location?.name ?? "", ...mcOptions];
        const shuffledOptions = shuffleWithSeed(allOptions, currentRound._id);
        const selectedOptionName = shuffledOptions[selectedOptionIndex];

        await submitGuess({
          roundId: currentRound._id as Id<"rounds">,
          mcOptionIndex: selectedOptionIndex,
          mcOptionName: selectedOptionName,
        });
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Fehler beim Absenden",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (
    gameByCode === undefined ||
    game === undefined ||
    myTeam === undefined ||
    currentRound === undefined
  ) {
    return <LoadingState />;
  }

  if (gameByCode === null || game === null) {
    return <NotFoundState />;
  }

  if (!myTeam) {
    return null;
  }

  if (game.status === "finished") {
    return (
      <GameFinishedView
        game={game}
        myTeam={myTeam}
        leaderboard={leaderboard ?? null}
        onNewGame={() => router.push("/")}
      />
    );
  }

  if (game.status === "paused") {
    return <GamePausedView game={game} myTeam={myTeam} />;
  }

  if (!currentRound) {
    return <WaitingForRoundView game={game} myTeam={myTeam} />;
  }

  const myGuessResult =
    roundGuesses?.find((g) => g.teamId === myTeam._id) ?? null;
  const locationData = buildLocationData(currentRound.location);

  return (
    <main className="min-h-screen flex flex-col">
      <GameHeader
        joinCode={game.joinCode}
        roundNumber={currentRound.roundNumber}
        totalRounds={game.totalRounds}
        roundStatus={currentRound.status}
        mode={currentRound.mode}
        teamName={myTeam.name}
        teamScore={myTeam.score}
      />

      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
        {currentRound.status === "pending" ? (
          <PendingRoundCard />
        ) : (
          <>
            <GameModeRenderer
              mode={currentRound.mode}
              status={currentRound.status}
              location={locationData}
              timeLimit={currentRound.timeLimit}
              countdownEndsAt={currentRound.countdownEndsAt ?? null}
              hasGuessed={Boolean(myGuess)}
              guessResult={buildGuessResult(myGuessResult)}
              roundId={currentRound._id}
              inputState={{
                eastingInput,
                northingInput,
                isSubmitting,
                submitError,
              }}
              inputActions={{
                setEastingInput,
                setNorthingInput,
                handleSubmit,
              }}
              mapInputState={{
                guessedPosition,
                isSubmitting,
                submitError,
              }}
              mapInputActions={{
                setGuessedPosition,
                handleSubmit,
              }}
              mcInputState={{
                selectedOptionIndex,
                isSubmitting,
                submitError,
              }}
              mcInputActions={{
                setSelectedOptionIndex,
                handleSubmit,
              }}
            />

            {(currentRound.status === "reveal" ||
              currentRound.status === "completed") && (
              <RevealResults
                myGuessResult={myGuessResult}
                leaderboard={leaderboard ?? null}
                myTeamId={myTeam._id}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}

function LoadingState(): React.ReactElement {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-muted-foreground">Wird geladen...</div>
    </main>
  );
}

function NotFoundState(): React.ReactElement {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-muted-foreground">Spiel nicht gefunden</div>
    </main>
  );
}

interface GameFinishedViewProps {
  game: { joinCode: string };
  myTeam: { name: string; score: number; _id: string };
  leaderboard: LeaderboardEntry[] | null;
  onNewGame: () => void;
}

function GameFinishedView({
  game,
  myTeam,
  leaderboard,
  onNewGame,
}: GameFinishedViewProps): React.ReactElement {
  return (
    <main className="min-h-screen flex flex-col">
      <GameHeader
        joinCode={game.joinCode}
        teamName={myTeam.name}
        teamScore={myTeam.score}
      />

      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Spiel beendet!</h1>
          <p className="text-muted-foreground">Endstand</p>
        </div>

        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            {leaderboard && (
              <LeaderboardCompact
                entries={leaderboard}
                highlightTeamId={myTeam._id}
                maxEntries={10}
              />
            )}
          </CardContent>
        </Card>

        <Button variant="outline" onClick={onNewGame}>
          Neues Spiel
        </Button>
      </div>
    </main>
  );
}

interface GamePausedViewProps {
  game: {
    joinCode: string;
    currentRoundIndex?: number | null;
    totalRounds: number;
  };
  myTeam: { name: string; score: number };
}

function GamePausedView({
  game,
  myTeam,
}: GamePausedViewProps): React.ReactElement {
  return (
    <main className="min-h-screen flex flex-col">
      <GameHeader
        joinCode={game.joinCode}
        roundNumber={(game.currentRoundIndex ?? 0) + 1}
        totalRounds={game.totalRounds}
        teamName={myTeam.name}
        teamScore={myTeam.score}
      />

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warning/20 flex items-center justify-center">
              <PauseIcon />
            </div>
            <h2 className="text-xl font-bold mb-2">Spiel pausiert</h2>
            <p className="text-muted-foreground">Warte auf den Moderator...</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

interface WaitingForRoundViewProps {
  game: { joinCode: string };
  myTeam: { name: string; score: number };
}

function WaitingForRoundView({
  game,
  myTeam,
}: WaitingForRoundViewProps): React.ReactElement {
  return (
    <main className="min-h-screen flex flex-col">
      <GameHeader
        joinCode={game.joinCode}
        teamName={myTeam.name}
        teamScore={myTeam.score}
      />

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              Warte auf die naechste Runde...
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function PendingRoundCard(): React.ReactElement {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6 text-center">
        <p className="text-muted-foreground">Warte auf Rundenstart...</p>
      </CardContent>
    </Card>
  );
}

function PauseIcon(): React.ReactElement {
  return (
    <Pause
      className="w-8 h-8 text-warning"
      fill="currentColor"
      aria-label="Pausiert"
    />
  );
}

interface RevealResultsProps {
  myGuessResult: {
    score?: number;
    distanceMeters?: number | null;
  } | null;
  leaderboard: LeaderboardEntry[] | null;
  myTeamId: string;
}

function RevealResults({
  myGuessResult,
  leaderboard,
  myTeamId,
}: RevealResultsProps): React.ReactElement {
  const hasScore = myGuessResult?.score !== undefined;
  const distanceMeters = myGuessResult?.distanceMeters ?? 0;
  const rating = hasScore ? getDistanceRating(distanceMeters).rating : "miss";

  return (
    <>
      {hasScore ? (
        <RoundScoreResult
          score={myGuessResult.score ?? 0}
          distanceMeters={distanceMeters}
          rating={rating}
        />
      ) : (
        <NoAnswerCard />
      )}

      {leaderboard && (
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Aktueller Stand
            </h4>
            <LeaderboardCompact
              entries={leaderboard}
              highlightTeamId={myTeamId}
              maxEntries={5}
            />
          </CardContent>
        </Card>
      )}
    </>
  );
}

function NoAnswerCard(): React.ReactElement {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6 text-center">
        <p className="text-muted-foreground">Keine Antwort abgegeben</p>
        <p className="text-3xl font-bold text-muted-foreground mt-2">
          +0 Punkte
        </p>
      </CardContent>
    </Card>
  );
}

function buildLocationData(
  location: Partial<LocationData> | null | undefined,
): LocationData {
  const utmData = extractLocationUtm(location);
  return {
    name: location?.name ?? "Unbekannter Ort",
    utmZone: utmData.utmZone,
    utmEasting: utmData.utmEasting,
    utmNorthing: utmData.utmNorthing,
    latitude: location?.latitude,
    longitude: location?.longitude,
    imageUrls: location?.imageUrls,
    // Direction & Distance mode fields
    bearingDegrees: location?.bearingDegrees,
    distanceMeters: location?.distanceMeters,
    startPointName: location?.startPointName,
    startPointImageUrls: location?.startPointImageUrls,
    startPointLatitude: location?.startPointLatitude,
    startPointLongitude: location?.startPointLongitude,
    // Multiple Choice mode fields
    mcOptions: location?.mcOptions,
  };
}

function buildGuessResult(
  guessData: {
    guessedUtmEasting?: number;
    guessedUtmNorthing?: number;
    guessedLatitude?: number;
    guessedLongitude?: number;
    score?: number;
    distanceMeters?: number | null;
    // Multiple Choice fields
    guessedOptionIndex?: number;
    guessedOptionName?: string;
  } | null,
): GuessResult | null {
  if (!guessData) return null;
  return {
    guessedUtmEasting: guessData.guessedUtmEasting,
    guessedUtmNorthing: guessData.guessedUtmNorthing,
    guessedLatitude: guessData.guessedLatitude,
    guessedLongitude: guessData.guessedLongitude,
    score: guessData.score,
    distanceMeters: guessData.distanceMeters,
    guessedOptionName: guessData.guessedOptionName,
  };
}
