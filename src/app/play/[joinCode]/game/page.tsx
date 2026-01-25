"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { GameHeader } from "@/components/GameHeader";
import { CountdownTimer, CountdownDisplay } from "@/components/CountdownTimer";
import { UtmInput } from "@/components/UtmInput";
import { UtmDisplay } from "@/components/UtmDisplay";
import { RoundScoreResult } from "@/components/TeamScoreCard";
import { LeaderboardCompact } from "@/components/Leaderboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function TeamGame({
  params,
}: {
  params: Promise<{ joinCode: string }>;
}) {
  const { joinCode } = use(params);
  const router = useRouter();

  // UTM input state
  const [eastingInput, setEastingInput] = useState("");
  const [northingInput, setNorthingInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Get game info by join code first to get ID
  const gameByCode = useQuery(api.games.getByJoinCode, {
    joinCode: joinCode.toUpperCase(),
  });

  // Get full game info with totalRounds
  const game = useQuery(
    api.games.get,
    gameByCode?._id ? { gameId: gameByCode._id } : "skip",
  );

  // Get my team
  const myTeam = useQuery(
    api.teams.getMyTeam,
    game?._id ? { gameId: game._id } : "skip",
  );

  // Get current round
  const currentRound = useQuery(
    api.rounds.getCurrent,
    game?._id ? { gameId: game._id } : "skip",
  );

  // Get my guess for current round
  const myGuess = useQuery(
    api.guesses.getMyGuess,
    currentRound?._id ? { roundId: currentRound._id } : "skip",
  );

  // Get round guesses (for reveal)
  const roundGuesses = useQuery(
    api.guesses.getForRound,
    currentRound?._id &&
      (currentRound.status === "reveal" || currentRound.status === "completed")
      ? { roundId: currentRound._id }
      : "skip",
  );

  // Get leaderboard
  const leaderboard = useQuery(
    api.leaderboard.get,
    game?._id ? { gameId: game._id } : "skip",
  );

  const submitGuess = useMutation(api.guesses.submit);

  // Reset input when round changes
  useEffect(() => {
    setEastingInput("");
    setNorthingInput("");
    setSubmitError(null);
  }, [currentRound?._id]);

  // Redirect if not in a team
  useEffect(() => {
    if (game && myTeam === null) {
      router.push(`/play/${joinCode}`);
    }
  }, [game, myTeam, router, joinCode]);

  const handleSubmit = async () => {
    if (!currentRound?._id) return;

    // Validate input
    if (currentRound.mode === "imageToUtm") {
      if (eastingInput.length !== 3 || northingInput.length !== 3) {
        setSubmitError(
          "Bitte vollständige Koordinaten eingeben (je 3 Ziffern)",
        );
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Calculate full UTM from input
      // Base values for Darmstadt area (these should come from the location)
      const baseEasting = currentRound.location?.utmEasting
        ? Math.floor(currentRound.location.utmEasting / 1000) * 1000
        : 477000;
      const baseNorthing = currentRound.location?.utmNorthing
        ? Math.floor(currentRound.location.utmNorthing / 1000) * 1000
        : 5523000;

      const fullEasting = baseEasting + Number.parseInt(eastingInput, 10);
      const fullNorthing = baseNorthing + Number.parseInt(northingInput, 10);

      await submitGuess({
        roundId: currentRound._id as Id<"rounds">,
        utmEasting: fullEasting,
        utmNorthing: fullNorthing,
      });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Fehler beim Absenden",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading states
  if (
    gameByCode === undefined ||
    game === undefined ||
    myTeam === undefined ||
    currentRound === undefined
  ) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Wird geladen...</div>
      </main>
    );
  }

  // Game not found
  if (gameByCode === null || game === null) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Spiel nicht gefunden</div>
      </main>
    );
  }

  // Not in a team
  if (!myTeam) {
    return null; // Will redirect
  }

  // Game finished - show final leaderboard
  if (game.status === "finished") {
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

          <Button variant="outline" onClick={() => router.push("/")}>
            Neues Spiel
          </Button>
        </div>
      </main>
    );
  }

  // Game paused
  if (game.status === "paused") {
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
                <svg
                  className="w-8 h-8 text-warning"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Spiel pausiert</h2>
              <p className="text-muted-foreground">Warte auf den Moderator...</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // No current round
  if (!currentRound) {
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
                Warte auf die nächste Runde...
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Find my guess result for reveal
  const myGuessResult = roundGuesses?.find((g) => g.teamId === myTeam._id);

  // Helper to safely get location UTM data with defaults
  const getLocationUtm = () => {
    const loc = currentRound.location;
    return {
      utmZone: loc?.utmZone ?? "32U",
      utmEasting: loc?.utmEasting ?? 0,
      utmNorthing: loc?.utmNorthing ?? 0,
    };
  };

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
        {/* SHOWING state - waiting for countdown */}
        {currentRound.status === "showing" && (
          <>
            {currentRound.mode === "imageToUtm" &&
              currentRound.location?.imageUrls?.[0] && (
                <Card className="w-full max-w-2xl overflow-hidden">
                  <img
                    src={currentRound.location.imageUrls[0]}
                    alt="Zu erratender Ort"
                    className="w-full h-auto max-h-[50vh] object-contain"
                  />
                </Card>
              )}

            {currentRound.mode === "utmToLocation" && currentRound.location && (
              <UtmDisplay
                utmZone={getLocationUtm().utmZone}
                easting={getLocationUtm().utmEasting}
                northing={getLocationUtm().utmNorthing}
                size="lg"
              />
            )}

            <Card className="w-full max-w-md">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground mb-2">
                  Gleich geht&apos;s los!
                </p>
                <CountdownDisplay seconds={currentRound.timeLimit} size="lg" />
              </CardContent>
            </Card>
          </>
        )}

        {/* GUESSING state - can submit */}
        {currentRound.status === "guessing" && (
          <>
            {/* Show image for imageToUtm mode */}
            {currentRound.mode === "imageToUtm" &&
              currentRound.location?.imageUrls?.[0] && (
                <Card className="w-full max-w-2xl overflow-hidden">
                  <img
                    src={currentRound.location.imageUrls[0]}
                    alt="Zu erratender Ort"
                    className="w-full h-auto max-h-[40vh] object-contain"
                  />
                </Card>
              )}

            {/* Show UTM for utmToLocation mode */}
            {currentRound.mode === "utmToLocation" && currentRound.location && (
              <UtmDisplay
                utmZone={getLocationUtm().utmZone}
                easting={getLocationUtm().utmEasting}
                northing={getLocationUtm().utmNorthing}
                size="md"
              />
            )}

            {/* Countdown */}
            {currentRound.countdownEndsAt && (
              <CountdownTimer
                endsAt={currentRound.countdownEndsAt}
                totalSeconds={currentRound.timeLimit}
                size="lg"
              />
            )}

            {/* Input or submitted state */}
            {myGuess ? (
              <Card className="w-full max-w-md">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-correct/20 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-correct"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="font-semibold text-correct">
                    Antwort abgegeben!
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Warte auf die Auflösung...
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="w-full max-w-md">
                <CardContent className="pt-6">
                  {currentRound.mode === "imageToUtm" && (
                    <>
                      <UtmInput
                        utmZone={currentRound.location?.utmZone ?? "32U"}
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
                        disabled={
                          eastingInput.length !== 3 ||
                          northingInput.length !== 3 ||
                          isSubmitting
                        }
                      >
                        {isSubmitting ? "Wird gesendet..." : "Antwort abgeben"}
                      </Button>
                    </>
                  )}

                  {currentRound.mode === "utmToLocation" && (
                    <div className="text-center">
                      <p className="text-muted-foreground mb-4">
                        Finde den Ort auf der Karte!
                      </p>
                      {/* TODO: Map component with PlanZeiger */}
                      <p className="text-sm text-muted-foreground">
                        Karten-Modus kommt bald...
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* REVEAL state - show results */}
        {(currentRound.status === "reveal" ||
          currentRound.status === "completed") && (
          <>
            {/* Correct answer */}
            {currentRound.location && (
              <Card className="w-full max-w-md bg-card/80">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Richtige Antwort
                  </p>
                  <h3 className="text-xl font-bold text-secondary mb-2">
                    {currentRound.location.name}
                  </h3>
                  <UtmDisplay
                    utmZone={getLocationUtm().utmZone}
                    easting={getLocationUtm().utmEasting}
                    northing={getLocationUtm().utmNorthing}
                    size="sm"
                    highlightLast3={false}
                  />
                </CardContent>
              </Card>
            )}

            {/* My result */}
            {myGuessResult ? (
              <RoundScoreResult
                score={myGuessResult.score}
                distanceMeters={myGuessResult.distanceMeters}
                rating={
                  myGuessResult.distanceMeters <= 10
                    ? "perfect"
                    : myGuessResult.distanceMeters <= 50
                      ? "excellent"
                      : myGuessResult.distanceMeters <= 200
                        ? "good"
                        : myGuessResult.distanceMeters <= 500
                          ? "fair"
                          : myGuessResult.distanceMeters <= 2000
                            ? "poor"
                            : "miss"
                }
              />
            ) : (
              <Card className="w-full max-w-md">
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">
                    Keine Antwort abgegeben
                  </p>
                  <p className="text-3xl font-bold text-muted-foreground mt-2">
                    +0 Punkte
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Mini leaderboard */}
            {leaderboard && (
              <Card className="w-full max-w-md">
                <CardContent className="pt-6">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    Aktueller Stand
                  </h4>
                  <LeaderboardCompact
                    entries={leaderboard}
                    highlightTeamId={myTeam._id}
                    maxEntries={5}
                  />
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* PENDING state - waiting for round to start */}
        {currentRound.status === "pending" && (
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Warte auf Rundenstart...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
