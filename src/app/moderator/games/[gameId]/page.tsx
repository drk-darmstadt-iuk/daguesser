"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { GameHeader } from "@/components/GameHeader";
import { Leaderboard } from "@/components/Leaderboard";
import { CountdownTimer, CountdownDisplay } from "@/components/CountdownTimer";
import { RoundStatus, GameStatus, GameMode } from "@/components/RoundStatus";
import { UtmDisplayCompact } from "@/components/UtmDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Authenticated, Unauthenticated } from "convex/react";

function GameControlPanel({ gameId }: { gameId: Id<"games"> }) {
  const router = useRouter();

  // Queries
  const game = useQuery(api.games.get, { gameId });
  const currentRound = useQuery(api.rounds.getCurrent, { gameId });
  const rounds = useQuery(api.rounds.listByGame, { gameId });
  const teams = useQuery(api.teams.listByGame, { gameId });
  const leaderboard = useQuery(api.leaderboard.get, { gameId });

  // Mutations
  const startGame = useMutation(api.games.start);
  const pauseGame = useMutation(api.games.pause);
  const resumeGame = useMutation(api.games.resume);
  const finishGame = useMutation(api.games.finish);
  const startRound = useMutation(api.rounds.start);
  const startCountdown = useMutation(api.rounds.startCountdown);
  const revealRound = useMutation(api.rounds.reveal);
  const completeRound = useMutation(api.rounds.complete);

  if (!game) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Wird geladen...</div>
      </main>
    );
  }

  const activeTeams = teams?.filter((t) => t.isActive) ?? [];

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/moderator")}
          >
            &larr; Zurück
          </Button>
          <div>
            <h1 className="font-semibold">{game.name}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {game.joinCode}
              </Badge>
              <GameStatus status={game.status} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/moderator/games/${gameId}/present`)}
          >
            Beamer-Ansicht
          </Button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Main Content */}
        <div className="flex-1 p-4 space-y-4">
          {/* Game Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Spiel-Steuerung</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {activeTeams.length} Teams aktiv
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Lobby State */}
              {game.status === "lobby" && (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Warte auf Teams... Teile den Code{" "}
                    <span className="font-mono font-bold text-secondary">
                      {game.joinCode}
                    </span>
                  </p>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => startGame({ gameId })}
                    disabled={
                      activeTeams.length === 0 || (rounds?.length ?? 0) === 0
                    }
                  >
                    Spiel starten
                  </Button>
                  {activeTeams.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center">
                      Mindestens ein Team muss beitreten
                    </p>
                  )}
                  {(rounds?.length ?? 0) === 0 && (
                    <p className="text-sm text-destructive text-center">
                      Keine Runden vorhanden - bitte Orte importieren
                    </p>
                  )}
                </div>
              )}

              {/* Playing State */}
              {game.status === "playing" && currentRound && (
                <div className="space-y-4">
                  {/* Current Round Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold">
                        Runde {currentRound.roundNumber}/{rounds?.length ?? 0}
                      </span>
                      <RoundStatus status={currentRound.status} />
                      <GameMode mode={currentRound.mode} />
                    </div>
                    {currentRound.location && (
                      <span className="text-muted-foreground">
                        {currentRound.location.name}
                      </span>
                    )}
                  </div>

                  {/* UTM Display */}
                  {currentRound.location && (
                    <div className="p-3 bg-muted rounded-lg">
                      <UtmDisplayCompact
                        utmZone={currentRound.location.utmZone ?? "32U"}
                        easting={currentRound.location.utmEasting ?? 0}
                        northing={currentRound.location.utmNorthing ?? 0}
                      />
                    </div>
                  )}

                  {/* Countdown Display */}
                  {currentRound.status === "guessing" &&
                    currentRound.countdownEndsAt && (
                      <div className="flex justify-center py-4">
                        <CountdownTimer
                          endsAt={currentRound.countdownEndsAt}
                          totalSeconds={currentRound.timeLimit}
                          size="lg"
                        />
                      </div>
                    )}

                  {/* Guess Progress */}
                  {(currentRound.status === "showing" ||
                    currentRound.status === "guessing") && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Antworten:</span>
                      <span className="font-mono">
                        {currentRound.guessCount ?? 0} /{" "}
                        {currentRound.totalTeams ?? 0}
                      </span>
                    </div>
                  )}

                  <Separator />

                  {/* Round Controls */}
                  <div className="flex flex-wrap gap-2">
                    {currentRound.status === "pending" && (
                      <Button
                        onClick={() => startRound({ gameId })}
                        className="flex-1"
                      >
                        Runde starten
                      </Button>
                    )}

                    {currentRound.status === "showing" && (
                      <Button
                        onClick={() => startCountdown({ gameId })}
                        className="flex-1"
                      >
                        Countdown starten ({currentRound.timeLimit}s)
                      </Button>
                    )}

                    {currentRound.status === "guessing" && (
                      <Button
                        variant="secondary"
                        onClick={() => revealRound({ gameId })}
                        className="flex-1"
                      >
                        Auflösen
                      </Button>
                    )}

                    {currentRound.status === "reveal" && (
                      <Button
                        onClick={() => completeRound({ gameId })}
                        className="flex-1"
                      >
                        {currentRound.roundNumber === (rounds?.length ?? 0)
                          ? "Spiel beenden"
                          : "Nächste Runde"}
                      </Button>
                    )}
                  </div>

                  {/* Game Controls */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => pauseGame({ gameId })}
                    >
                      Pausieren
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => finishGame({ gameId })}
                    >
                      Spiel beenden
                    </Button>
                  </div>
                </div>
              )}

              {/* Paused State */}
              {game.status === "paused" && (
                <div className="space-y-4 text-center">
                  <p className="text-warning font-semibold">Spiel pausiert</p>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => resumeGame({ gameId })}
                  >
                    Fortsetzen
                  </Button>
                </div>
              )}

              {/* Finished State */}
              {game.status === "finished" && (
                <div className="space-y-4 text-center">
                  <p className="text-correct font-semibold">Spiel beendet</p>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/moderator/games/new")}
                  >
                    Neues Spiel erstellen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rounds Overview */}
          {rounds && rounds.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Runden-Übersicht</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {rounds.map((round) => (
                    <Badge
                      key={round._id}
                      variant={
                        round.status === "completed"
                          ? "secondary"
                          : round._id === currentRound?._id
                            ? "default"
                            : "outline"
                      }
                      className={
                        round._id === currentRound?._id ? "bg-secondary" : ""
                      }
                    >
                      {round.roundNumber}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Leaderboard */}
        <div className="w-80 border-l border-border p-4">
          <h2 className="font-semibold mb-4">Leaderboard</h2>
          {leaderboard && leaderboard.length > 0 ? (
            <Leaderboard entries={leaderboard} showRoundScores size="sm" />
          ) : (
            <p className="text-sm text-muted-foreground">Noch keine Punkte</p>
          )}

          <Separator className="my-4" />

          {/* Active Teams */}
          <h3 className="font-semibold text-sm mb-2">
            Teams ({activeTeams.length})
          </h3>
          <div className="space-y-1">
            {activeTeams.map((team) => (
              <div
                key={team._id}
                className="flex items-center justify-between text-sm"
              >
                <span>{team.name}</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {team.score}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function GameControlPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);
  const router = useRouter();

  return (
    <>
      <Unauthenticated>
        <main className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">Bitte melde dich an.</p>
              <Button onClick={() => router.push("/moderator")}>
                Zur Anmeldung
              </Button>
            </CardContent>
          </Card>
        </main>
      </Unauthenticated>
      <Authenticated>
        <GameControlPanel gameId={gameId as Id<"games">} />
      </Authenticated>
    </>
  );
}
