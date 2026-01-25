"use client";

import { Badge } from "@/components/ui/badge";

interface GuessProgressProps {
  guessCount: number;
  totalTeams: number;
  allTeamsGuessed?: boolean;
  /** Size variant for display */
  size?: "sm" | "lg";
}

export function GuessProgress({
  guessCount,
  totalTeams,
  allTeamsGuessed = false,
  size = "sm",
}: GuessProgressProps): React.ReactElement {
  if (size === "lg") {
    return (
      <div className="flex items-center justify-center gap-4 mt-8 text-2xl">
        <span className="text-muted-foreground">Antworten:</span>
        <span className="font-mono font-bold text-secondary">
          {guessCount} / {totalTeams}
        </span>
        {allTeamsGuessed && (
          <Badge className="text-lg px-4 py-1 bg-correct">Alle fertig!</Badge>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">Antworten:</span>
      <span className="font-mono">
        {guessCount} / {totalTeams}
      </span>
    </div>
  );
}
