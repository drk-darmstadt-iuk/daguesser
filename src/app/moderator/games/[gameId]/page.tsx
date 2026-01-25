"use client";

import {
  Authenticated,
  Unauthenticated,
  useMutation,
  useQuery,
} from "convex/react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { CountdownTimer } from "@/components/CountdownTimer";
import {
  GameControls,
  GuessProgress,
  RoundControls,
  RoundsOverview,
  TeamsSidebar,
} from "@/components/moderator";
import { GameMode, GameStatus, RoundStatus } from "@/components/RoundStatus";
import { UtmDisplayCompact } from "@/components/UtmDisplay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { extractLocationUtm } from "@/lib/utm-helpers";

function GameControlPanel({
  gameId,
}: {
  gameId: Id<"games">;
}): React.ReactElement {
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
  const totalRounds = rounds?.length ?? 0;

  return (
    <main className="min-h-screen flex flex-col">
      <ControlHeader
        gameName={game.name}
        joinCode={game.joinCode}
        gameStatus={game.status}
        gameId={gameId}
        onBack={() => router.push("/moderator")}
        onOpenBeamer={() => router.push(`/moderator/games/${gameId}/present`)}
      />

      <div className="flex-1 flex">
        <div className="flex-1 p-4 space-y-4">
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
              {game.status === "lobby" && (
                <LobbyControls
                  joinCode={game.joinCode}
                  activeTeamCount={activeTeams.length}
                  roundCount={totalRounds}
                  onStartGame={() => startGame({ gameId })}
                />
              )}

              {game.status === "playing" && currentRound && (
                <PlayingControls
                  currentRound={currentRound}
                  totalRounds={totalRounds}
                  onStartRound={() => startRound({ gameId })}
                  onStartCountdown={() => startCountdown({ gameId })}
                  onReveal={() => revealRound({ gameId })}
                  onComplete={() => completeRound({ gameId })}
                  onPause={() => pauseGame({ gameId })}
                  onFinish={() => finishGame({ gameId })}
                />
              )}

              {game.status === "paused" && (
                <PausedControls onResume={() => resumeGame({ gameId })} />
              )}

              {game.status === "finished" && (
                <FinishedControls
                  onNewGame={() => router.push("/moderator/games/new")}
                />
              )}
            </CardContent>
          </Card>

          <RoundsOverview
            rounds={rounds ?? []}
            currentRoundId={currentRound?._id}
          />
        </div>

        <TeamsSidebar teams={teams ?? []} leaderboard={leaderboard ?? []} />
      </div>
    </main>
  );
}

interface ControlHeaderProps {
  gameName: string;
  joinCode: string;
  gameStatus: "lobby" | "playing" | "paused" | "finished";
  gameId: Id<"games">;
  onBack: () => void;
  onOpenBeamer: () => void;
}

function ControlHeader({
  gameName,
  joinCode,
  gameStatus,
  onBack,
  onOpenBeamer,
}: ControlHeaderProps): React.ReactElement {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          &larr; Zurueck
        </Button>
        <div>
          <h1 className="font-semibold">{gameName}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {joinCode}
            </Badge>
            <GameStatus status={gameStatus} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onOpenBeamer}>
          Beamer-Ansicht
        </Button>
      </div>
    </header>
  );
}

interface LobbyControlsProps {
  joinCode: string;
  activeTeamCount: number;
  roundCount: number;
  onStartGame: () => void;
}

function LobbyControls({
  joinCode,
  activeTeamCount,
  roundCount,
  onStartGame,
}: LobbyControlsProps): React.ReactElement {
  const canStart = activeTeamCount > 0 && roundCount > 0;

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Warte auf Teams... Teile den Code{" "}
        <span className="font-mono font-bold text-secondary">{joinCode}</span>
      </p>
      <Button
        size="lg"
        className="w-full"
        onClick={onStartGame}
        disabled={!canStart}
      >
        Spiel starten
      </Button>
      {activeTeamCount === 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Mindestens ein Team muss beitreten
        </p>
      )}
      {roundCount === 0 && (
        <p className="text-sm text-destructive text-center">
          Keine Runden vorhanden - bitte Orte importieren
        </p>
      )}
    </div>
  );
}

interface CurrentRoundData {
  _id: Id<"rounds">;
  roundNumber: number;
  status: "pending" | "showing" | "guessing" | "reveal" | "completed";
  mode: "imageToUtm" | "utmToLocation";
  timeLimit: number;
  countdownEndsAt?: number;
  guessCount?: number;
  totalTeams?: number;
  location?: {
    name: string;
    utmZone?: string;
    utmEasting?: number;
    utmNorthing?: number;
  } | null;
}

interface PlayingControlsProps {
  currentRound: CurrentRoundData;
  totalRounds: number;
  onStartRound: () => void;
  onStartCountdown: () => void;
  onReveal: () => void;
  onComplete: () => void;
  onPause: () => void;
  onFinish: () => void;
}

function PlayingControls({
  currentRound,
  totalRounds,
  onStartRound,
  onStartCountdown,
  onReveal,
  onComplete,
  onPause,
  onFinish,
}: PlayingControlsProps): React.ReactElement {
  const utm = extractLocationUtm(currentRound.location);
  const showGuessProgress =
    currentRound.status === "showing" || currentRound.status === "guessing";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold">
            Runde {currentRound.roundNumber}/{totalRounds}
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

      {currentRound.location && (
        <div className="p-3 bg-muted rounded-lg">
          <UtmDisplayCompact
            utmZone={utm.utmZone}
            easting={utm.utmEasting}
            northing={utm.utmNorthing}
          />
        </div>
      )}

      {currentRound.status === "guessing" && currentRound.countdownEndsAt && (
        <div className="flex justify-center py-4">
          <CountdownTimer
            endsAt={currentRound.countdownEndsAt}
            totalSeconds={currentRound.timeLimit}
            size="lg"
          />
        </div>
      )}

      {showGuessProgress && (
        <GuessProgress
          guessCount={currentRound.guessCount ?? 0}
          totalTeams={currentRound.totalTeams ?? 0}
        />
      )}

      <Separator />

      <RoundControls
        roundStatus={currentRound.status}
        roundNumber={currentRound.roundNumber}
        totalRounds={totalRounds}
        timeLimit={currentRound.timeLimit}
        onStartRound={onStartRound}
        onStartCountdown={onStartCountdown}
        onReveal={onReveal}
        onComplete={onComplete}
      />

      <GameControls
        gameStatus="playing"
        onPause={onPause}
        onResume={() => {}}
        onFinish={onFinish}
      />
    </div>
  );
}

interface PausedControlsProps {
  onResume: () => void;
}

function PausedControls({ onResume }: PausedControlsProps): React.ReactElement {
  return (
    <div className="space-y-4 text-center">
      <p className="text-warning font-semibold">Spiel pausiert</p>
      <Button size="lg" className="w-full" onClick={onResume}>
        Fortsetzen
      </Button>
    </div>
  );
}

interface FinishedControlsProps {
  onNewGame: () => void;
}

function FinishedControls({
  onNewGame,
}: FinishedControlsProps): React.ReactElement {
  return (
    <div className="space-y-4 text-center">
      <p className="text-correct font-semibold">Spiel beendet</p>
      <Button variant="outline" onClick={onNewGame}>
        Neues Spiel erstellen
      </Button>
    </div>
  );
}

export default function GameControlPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}): React.ReactElement {
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
