"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameStatus } from "@/components/RoundStatus";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";

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
                  <div
                    key={game._id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/moderator/games/${game._id}`)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      router.push(`/moderator/games/${game._id}`)
                    }
                    role="button"
                    tabIndex={0}
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
                  </div>
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
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-8 h-8 text-primary-foreground"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
            </svg>
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
            <svg
              className="w-5 h-5 mr-2"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
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
