"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { Crosshair } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { JoinCodeInput } from "@/components/JoinCodeInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shouldNavigate, setShouldNavigate] = useState(false);

  // Check if game exists when code is complete
  const game = useQuery(
    api.games.getByJoinCode,
    joinCode.length === 6 ? { joinCode } : "skip",
  );

  // Derived loading state - loading when we have a complete code but no result yet
  const isLoading = joinCode.length === 6 && game === undefined;

  // Navigate when game is found and user wants to join
  useEffect(() => {
    if (shouldNavigate && game && !error) {
      router.push(`/play/${joinCode}`);
    } else if (shouldNavigate && game === null) {
      setError("Spiel nicht gefunden. Bitte Code prüfen.");
      setShouldNavigate(false);
    }
  }, [shouldNavigate, game, error, router, joinCode]);

  const handleCodeComplete = (code: string) => {
    setError(null);
    // If game is already loaded, navigate immediately
    if (game) {
      router.push(`/play/${code}`);
    } else if (game === null) {
      setError("Spiel nicht gefunden. Bitte Code prüfen.");
    } else {
      // Game is still loading, set flag to navigate when ready
      setShouldNavigate(true);
    }
  };

  const handleJoin = () => {
    if (joinCode.length === 6) {
      handleCodeComplete(joinCode);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 topo-bg">
      {/* Logo and Title */}
      <div className="flex flex-col items-center gap-4 mb-12">
        <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center">
          <Crosshair
            className="w-12 h-12 text-primary-foreground"
            aria-hidden="true"
          />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">DAGuesser</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Kartenkunde-Lernspiel für das DRK Darmstadt
        </p>
      </div>

      {/* Join Card */}
      <Card className="w-full max-w-md bg-card/80 backdrop-blur">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6">
            <JoinCodeInput
              value={joinCode}
              onChange={(value) => {
                setJoinCode(value);
                setError(null);
                setShouldNavigate(false);
              }}
              onComplete={handleCodeComplete}
              disabled={isLoading || shouldNavigate}
            />

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            {game && !error && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Spiel gefunden:</p>
                <p className="font-semibold text-secondary">{game.name}</p>
                <p className="text-xs text-muted-foreground">
                  {game.teamCount} Teams warten
                </p>
              </div>
            )}

            <Button
              size="lg"
              className="w-full"
              onClick={handleJoin}
              disabled={
                joinCode.length !== 6 || isLoading || shouldNavigate || !game
              }
            >
              {isLoading || shouldNavigate
                ? "Wird geladen..."
                : "Spiel beitreten"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Moderator Link */}
      <div className="mt-8">
        <Button
          variant="link"
          className="text-muted-foreground"
          onClick={() => router.push("/moderator")}
        >
          Als Moderator anmelden
        </Button>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-4 text-xs text-muted-foreground">
        DRK Darmstadt - IuK
      </footer>
    </main>
  );
}
