"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../convex/_generated/api";
import { LobbyHeader } from "@/components/GameHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TeamLobby({
  params,
}: {
  params: Promise<{ joinCode: string }>;
}) {
  const { joinCode } = use(params);
  const router = useRouter();
  const { signIn } = useAuthActions();

  const [teamName, setTeamName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);

  // Get game info
  const game = useQuery(api.games.getByJoinCode, {
    joinCode: joinCode.toUpperCase(),
  });

  // Get team list
  const teams = useQuery(
    api.teams.listByGame,
    game?._id ? { gameId: game._id } : "skip",
  );

  // Get my team (if already joined)
  const myTeam = useQuery(
    api.teams.getMyTeam,
    game?._id ? { gameId: game._id } : "skip",
  );

  const joinTeam = useMutation(api.teams.join);

  // If already joined and game is playing, redirect to game
  useEffect(() => {
    if (myTeam && game) {
      setHasJoined(true);
      setTeamName(myTeam.name);

      if (game.status === "playing" || game.status === "paused") {
        router.push(`/play/${joinCode}/game`);
      }
    }
  }, [myTeam, game, router, joinCode]);

  // Watch for game start
  useEffect(() => {
    if (hasJoined && game?.status === "playing") {
      router.push(`/play/${joinCode}/game`);
    }
  }, [hasJoined, game?.status, router, joinCode]);

  const handleJoin = async () => {
    if (!teamName.trim()) {
      setError("Bitte gib einen Teamnamen ein");
      return;
    }

    setError(null);
    setIsJoining(true);

    try {
      // Sign in anonymously if not already
      await signIn("anonymous");

      // Join the game
      await joinTeam({
        joinCode: joinCode.toUpperCase(),
        teamName: teamName.trim(),
      });

      setHasJoined(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Beitreten");
    } finally {
      setIsJoining(false);
    }
  };

  // Game not found
  if (game === null) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-bold text-destructive mb-2">
              Spiel nicht gefunden
            </h2>
            <p className="text-muted-foreground mb-4">
              Der Code &quot;{joinCode}&quot; ist ungültig oder das Spiel wurde
              beendet.
            </p>
            <Button onClick={() => router.push("/")}>Zurück</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Loading
  if (game === undefined) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Wird geladen...</div>
      </main>
    );
  }

  // Game finished
  if (game.status === "finished") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-bold mb-2">Spiel beendet</h2>
            <p className="text-muted-foreground mb-4">
              Dieses Spiel ist bereits beendet.
            </p>
            <Button onClick={() => router.push("/")}>Neues Spiel suchen</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col topo-bg">
      <LobbyHeader
        joinCode={game.joinCode}
        gameName={game.name}
        teamCount={teams?.filter((t) => t.isActive).length ?? 0}
      />

      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-8">
        {!hasJoined ? (
          /* Join Form */
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
                    placeholder="z.B. Die Kartenkünstler"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                    disabled={isJoining}
                    autoFocus
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button
                  size="lg"
                  onClick={handleJoin}
                  disabled={!teamName.trim() || isJoining}
                >
                  {isJoining ? "Wird beigetreten..." : "Beitreten"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Waiting State */
          <Card className="w-full max-w-md bg-card/80 backdrop-blur">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/20 flex items-center justify-center animate-pulse">
                <svg
                  className="w-8 h-8 text-secondary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
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
        )}

        {/* Team List */}
        <Card className="w-full max-w-md bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base">
              Teams ({teams?.filter((t) => t.isActive).length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {teams
                ?.filter((t) => t.isActive)
                .map((team) => (
                  <Badge
                    key={team._id}
                    variant={team._id === myTeam?._id ? "default" : "secondary"}
                    className={
                      team._id === myTeam?._id
                        ? "bg-secondary text-secondary-foreground"
                        : ""
                    }
                  >
                    {team.name}
                  </Badge>
                ))}
              {(!teams || teams.filter((t) => t.isActive).length === 0) && (
                <span className="text-muted-foreground text-sm">
                  Noch keine Teams beigetreten
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
