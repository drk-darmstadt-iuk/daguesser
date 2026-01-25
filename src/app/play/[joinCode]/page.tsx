"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { LobbyHeader } from "@/components/GameHeader";
import { LoadingPage } from "@/components/states/LoadingPage";
import { NotFoundPage } from "@/components/states/NotFoundPage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";

interface TeamLobbyProps {
  params: Promise<{ joinCode: string }>;
}

export default function TeamLobby({
  params,
}: TeamLobbyProps): React.ReactElement | null {
  const { joinCode } = use(params);
  const router = useRouter();
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();

  const [teamName, setTeamName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);

  const normalizedJoinCode = joinCode.toUpperCase();

  const game = useQuery(api.games.getByJoinCode, {
    joinCode: normalizedJoinCode,
  });

  const teams = useQuery(
    api.teams.listByGame,
    game?._id ? { gameId: game._id } : "skip",
  );

  const myTeam = useQuery(
    api.teams.getMyTeam,
    game?._id ? { gameId: game._id } : "skip",
  );

  const joinTeam = useMutation(api.teams.join);

  const activeTeams = teams?.filter((t) => t.isActive) ?? [];

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      void signIn("anonymous");
    }
  }, [isAuthLoading, isAuthenticated, signIn]);

  useEffect(() => {
    if (!myTeam || !game) return;

    setHasJoined(true);
    setTeamName(myTeam.name);

    if (game.status === "playing" || game.status === "paused") {
      router.push(`/play/${joinCode}/game`);
    }
  }, [myTeam, game, router, joinCode]);

  useEffect(() => {
    if (hasJoined && game?.status === "playing") {
      router.push(`/play/${joinCode}/game`);
    }
  }, [hasJoined, game?.status, router, joinCode]);

  async function handleJoin(): Promise<void> {
    const trimmedName = teamName.trim();

    if (!trimmedName) {
      setError("Bitte gib einen Teamnamen ein");
      return;
    }

    if (!isAuthenticated) {
      setError("Authentifizierung laeuft noch, bitte kurz warten...");
      return;
    }

    setError(null);
    setIsJoining(true);

    try {
      await joinTeam({
        joinCode: normalizedJoinCode,
        teamName: trimmedName,
      });
      setHasJoined(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Beitreten");
    } finally {
      setIsJoining(false);
    }
  }

  if (game === undefined) {
    return <LoadingPage />;
  }

  if (game === null) {
    return (
      <NotFoundPage
        title="Spiel nicht gefunden"
        message={`Der Code "${joinCode}" ist ungueltig oder das Spiel wurde beendet.`}
        onBack={() => router.push("/")}
        backLabel="Zurueck"
      />
    );
  }

  if (game.status === "finished") {
    return (
      <NotFoundPage
        title="Spiel beendet"
        message="Dieses Spiel ist bereits beendet."
        onBack={() => router.push("/")}
        backLabel="Neues Spiel suchen"
      />
    );
  }

  return (
    <main className="min-h-screen flex flex-col topo-bg">
      <LobbyHeader
        joinCode={game.joinCode}
        gameName={game.name}
        teamCount={activeTeams.length}
      />

      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-8">
        {hasJoined ? (
          <WaitingCard teamName={teamName} />
        ) : (
          <JoinForm
            teamName={teamName}
            onTeamNameChange={setTeamName}
            onJoin={handleJoin}
            isJoining={isJoining}
            isAuthLoading={isAuthLoading}
            isAuthenticated={isAuthenticated}
            error={error}
          />
        )}

        <TeamList teams={activeTeams} myTeamId={myTeam?._id ?? null} />
      </div>
    </main>
  );
}

interface JoinFormProps {
  teamName: string;
  onTeamNameChange: (name: string) => void;
  onJoin: () => void;
  isJoining: boolean;
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

function JoinForm({
  teamName,
  onTeamNameChange,
  onJoin,
  isJoining,
  isAuthLoading,
  isAuthenticated,
  error,
}: JoinFormProps): React.ReactElement {
  function getButtonLabel(): string {
    if (isAuthLoading) return "Wird verbunden...";
    if (isJoining) return "Wird beigetreten...";
    return "Beitreten";
  }

  return (
    <Card className="w-full max-w-md bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle>Team beitreten</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="teamName">Teamname</Label>
            <Input
              id="teamName"
              placeholder="z.B. Die Kartenkuenstler"
              value={teamName}
              onChange={(e) => onTeamNameChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onJoin()}
              disabled={isJoining}
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            size="lg"
            onClick={onJoin}
            disabled={!teamName.trim() || isJoining || !isAuthenticated}
          >
            {getButtonLabel()}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface WaitingCardProps {
  teamName: string;
}

function WaitingCard({ teamName }: WaitingCardProps): React.ReactElement {
  return (
    <Card className="w-full max-w-md bg-card/80 backdrop-blur">
      <CardContent className="pt-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/20 flex items-center justify-center animate-pulse">
          <Clock
            className="w-8 h-8 text-secondary"
            aria-label="Warten auf Spielstart"
          />
        </div>
        <h2 className="text-xl font-bold mb-2">Warten auf Spielstart</h2>
        <p className="text-muted-foreground mb-4">
          Du bist dabei als{" "}
          <span className="text-secondary font-semibold">{teamName}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Der Moderator startet das Spiel gleich...
        </p>
      </CardContent>
    </Card>
  );
}

interface TeamListProps {
  teams: Array<{ _id: string; name: string; isActive: boolean }>;
  myTeamId: string | null;
}

function TeamList({ teams, myTeamId }: TeamListProps): React.ReactElement {
  return (
    <Card className="w-full max-w-md bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-base">Teams ({teams.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {teams.length === 0 ? (
            <span className="text-muted-foreground text-sm">
              Noch keine Teams beigetreten
            </span>
          ) : (
            teams.map((team) => (
              <Badge
                key={team._id}
                variant={team._id === myTeamId ? "default" : "secondary"}
                className={
                  team._id === myTeamId
                    ? "bg-secondary text-secondary-foreground"
                    : ""
                }
              >
                {team.name}
              </Badge>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
