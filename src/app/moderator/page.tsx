"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useQuery,
} from "convex/react";
import { Crosshair, Github } from "lucide-react";
import { useRouter } from "next/navigation";
import { GameStatus } from "@/components/RoundStatus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";

function ModeratorDashboard() {
  const router = useRouter();
  const { signOut } = useAuthActions();

  const games = useQuery(api.games.listMyGames);

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Moderator Dashboard</h1>
            <p className="text-muted-foreground">Spiele verwalten</p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => router.push("/moderator/games/new")}>
              Neues Spiel
            </Button>
            <Button variant="outline" onClick={() => signOut()}>
              Abmelden
            </Button>
          </div>
        </div>

        {/* Games List */}
        <Card>
          <CardHeader>
            <CardTitle>Meine Spiele</CardTitle>
          </CardHeader>
          <CardContent>
            {games === undefined ? (
              <p className="text-muted-foreground">Wird geladen...</p>
            ) : games.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Du hast noch keine Spiele erstellt.
                </p>
                <Button onClick={() => router.push("/moderator/games/new")}>
                  Erstes Spiel erstellen
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {games.map((game) => (
                  <button
                    type="button"
                    key={game._id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer w-full text-left"
                    onClick={() => router.push(`/moderator/games/${game._id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-semibold">{game.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className="font-mono text-xs"
                          >
                            {game.joinCode}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(game.createdAt).toLocaleDateString(
                              "de-DE",
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <GameStatus status={game.status} />
                      <Button variant="ghost" size="sm">
                        Öffnen
                      </Button>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function SignInPrompt() {
  const { signIn } = useAuthActions();

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center">
            <Crosshair
              className="w-8 h-8 text-primary-foreground"
              aria-hidden="true"
            />
          </div>
          <CardTitle>Moderator Anmeldung</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6">
            Melde dich an, um Spiele zu erstellen und zu moderieren.
          </p>
          <Button
            size="lg"
            className="w-full"
            onClick={() => void signIn("github")}
          >
            <Github className="w-5 h-5 mr-2" aria-hidden="true" />
            Mit GitHub anmelden
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

export default function ModeratorPage() {
  return (
    <>
      <AuthLoading>
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Wird geladen...</div>
        </main>
      </AuthLoading>
      <Unauthenticated>
        <SignInPrompt />
      </Unauthenticated>
      <Authenticated>
        <ModeratorDashboard />
      </Authenticated>
    </>
  );
}
