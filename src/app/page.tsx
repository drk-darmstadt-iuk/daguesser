"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { JoinCodeInput } from "@/components/JoinCodeInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if game exists when code is complete
  const game = useQuery(
    api.games.getByJoinCode,
    joinCode.length === 6 ? { joinCode } : "skip",
  );

  const handleCodeComplete = async (code: string) => {
    setError(null);
    setIsLoading(true);

    // Small delay to allow query to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (game === undefined) {
      // Still loading
      return;
    }

    if (game === null) {
      setError("Spiel nicht gefunden. Bitte Code prüfen.");
      setIsLoading(false);
      return;
    }

    // Navigate to game lobby
    router.push(`/play/${code}`);
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
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-12 h-12 text-primary-foreground"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
          </svg>
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
              }}
              onComplete={handleCodeComplete}
              disabled={isLoading}
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
              disabled={joinCode.length !== 6 || isLoading || !game}
            >
              {isLoading ? "Wird geladen..." : "Spiel beitreten"}
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
