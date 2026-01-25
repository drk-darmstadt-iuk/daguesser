"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { GameHeaderBeamer } from "@/components/GameHeader";
import { LeaderboardBeamer } from "@/components/Leaderboard";
import { CountdownTimer, CountdownDisplay } from "@/components/CountdownTimer";
import { UtmDisplay } from "@/components/UtmDisplay";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function BeamerView({ gameId }: { gameId: Id<"games"> }) {
  // Queries
  const game = useQuery(api.games.get, { gameId });
  const currentRound = useQuery(api.rounds.getCurrent, { gameId });
  const leaderboard = useQuery(api.leaderboard.get, { gameId });

  if (!game) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-2xl">Wird geladen...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <GameHeaderBeamer
        roundNumber={
          currentRound ? currentRound.roundNumber : undefined
        }
        totalRounds={game.totalRounds}
        joinCode={game.joinCode}
      />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        {/* Lobby State - Show join code prominently */}
        {game.status === "lobby" && (
          <div className="text-center space-y-8">
            <h1 className="text-4xl font-bold text-muted-foreground">
              Bereit zum Spielen?
            </h1>
            <div className="space-y-4">
              <p className="text-2xl text-muted-foreground">
                Gib diesen Code ein:
              </p>
              <div className="font-mono text-9xl font-bold text-primary tracking-[0.3em]">
                {game.joinCode}
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 text-2xl text-muted-foreground">
              <span className="text-secondary text-3xl font-bold">
                {game.teamCount ?? 0}
              </span>
              <span>Teams warten</span>
            </div>
          </div>
        )}

        {/* Playing State */}
        {game.status === "playing" && currentRound && (
          <div className="w-full max-w-6xl space-y-8">
            {/* Round Status */}
            <div className="text-center space-y-4">
              {/* PENDING - Waiting to start */}
              {currentRound.status === "pending" && (
                <h2 className="text-4xl font-bold text-muted-foreground">
                  Nächste Runde...
                </h2>
              )}

              {/* SHOWING - Display location/image */}
              {currentRound.status === "showing" && (
                <>
                  {currentRound.mode === "imageToUtm" &&
                    currentRound.location?.imageUrls?.[0] && (
                      <div className="flex justify-center">
                        <img
                          src={currentRound.location.imageUrls[0]}
                          alt="Ort"
                          className="max-h-[60vh] rounded-xl shadow-2xl"
                        />
                      </div>
                    )}

                  {currentRound.mode === "utmToLocation" &&
                    currentRound.location && (
                      <UtmDisplay
                        utmZone={currentRound.location.utmZone ?? "32U"}
                        easting={currentRound.location.utmEasting ?? 0}
                        northing={currentRound.location.utmNorthing ?? 0}
                        size="xl"
                        className="mx-auto"
                      />
                    )}

                  <div className="mt-8">
                    <CountdownDisplay
                      seconds={currentRound.timeLimit}
                      size="xl"
                    />
                    <p className="text-xl text-muted-foreground mt-2">
                      Gleich geht&apos;s los!
                    </p>
                  </div>
                </>
              )}

              {/* GUESSING - Countdown running */}
              {currentRound.status === "guessing" && (
                <>
                  {currentRound.mode === "imageToUtm" &&
                    currentRound.location?.imageUrls?.[0] && (
                      <div className="flex justify-center mb-8">
                        <img
                          src={currentRound.location.imageUrls[0]}
                          alt="Ort"
                          className="max-h-[40vh] rounded-xl shadow-2xl"
                        />
                      </div>
                    )}

                  {currentRound.mode === "utmToLocation" &&
                    currentRound.location && (
                      <div className="mb-8">
                        <UtmDisplay
                          utmZone={currentRound.location.utmZone ?? "32U"}
                          easting={currentRound.location.utmEasting ?? 0}
                          northing={currentRound.location.utmNorthing ?? 0}
                          size="lg"
                          className="mx-auto"
                        />
                      </div>
                    )}

                  {currentRound.countdownEndsAt && (
                    <CountdownTimer
                      endsAt={currentRound.countdownEndsAt}
                      totalSeconds={currentRound.timeLimit}
                      size="xl"
                      showMs
                    />
                  )}

                  {/* Guess progress */}
                  <div className="flex items-center justify-center gap-4 mt-8 text-2xl">
                    <span className="text-muted-foreground">Antworten:</span>
                    <span className="font-mono font-bold text-secondary">
                      {currentRound.guessCount ?? 0} / {currentRound.totalTeams ?? 0}
                    </span>
                    {currentRound.allTeamsGuessed && (
                      <Badge className="text-lg px-4 py-1 bg-correct">
                        Alle fertig!
                      </Badge>
                    )}
                  </div>
                </>
              )}

              {/* REVEAL - Show results */}
              {(currentRound.status === "reveal" ||
                currentRound.status === "completed") && (
                <>
                  <h2 className="text-4xl font-bold text-correct">
                    Richtige Antwort
                  </h2>
                  <h3 className="text-5xl font-bold text-secondary mt-4">
                    {currentRound.location?.name}
                  </h3>
                  {currentRound.location && (
                    <UtmDisplay
                      utmZone={currentRound.location.utmZone ?? "32U"}
                      easting={currentRound.location.utmEasting ?? 0}
                      northing={currentRound.location.utmNorthing ?? 0}
                      size="lg"
                      highlightLast3={false}
                      className="mx-auto mt-8"
                    />
                  )}

                  {/* Mini Leaderboard */}
                  {leaderboard && leaderboard.length > 0 && (
                    <div className="mt-12 max-w-2xl mx-auto">
                      <LeaderboardBeamer
                        entries={leaderboard.slice(0, 5)}
                        showRoundScores
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Paused State */}
        {game.status === "paused" && (
          <div className="text-center space-y-8">
            <div className="w-32 h-32 mx-auto rounded-full bg-warning/20 flex items-center justify-center">
              <svg
                className="w-16 h-16 text-warning"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold text-warning">Pause</h1>
          </div>
        )}

        {/* Finished State */}
        {game.status === "finished" && leaderboard && (
          <div className="w-full max-w-4xl space-y-8">
            <h1 className="text-5xl font-bold text-center text-correct">
              Spiel beendet!
            </h1>
            <h2 className="text-3xl text-center text-muted-foreground mb-8">
              Endstand
            </h2>

            {/* Winner highlight */}
            {leaderboard[0] && (
              <div className="text-center mb-8">
                <p className="text-2xl text-muted-foreground">Gewinner</p>
                <p className="text-6xl font-bold text-yellow-500 mt-2">
                  {leaderboard[0].teamName}
                </p>
                <p className="text-4xl font-mono font-bold text-secondary mt-4">
                  {leaderboard[0].score.toLocaleString("de-DE")} Punkte
                </p>
              </div>
            )}

            <LeaderboardBeamer entries={leaderboard} />
          </div>
        )}
      </div>

      {/* Footer with branding */}
      <footer className="text-center py-4 text-muted-foreground text-sm">
        DAGuesser - DRK Darmstadt IuK
      </footer>
    </main>
  );
}

export default function BeamerPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);

  return <BeamerView gameId={gameId as Id<"games">} />;
}
