"use client";

import { LeaderboardBeamer } from "@/components/Leaderboard";
import type { LeaderboardEntryData } from "./types";

interface BeamerFinishedProps {
  leaderboard: LeaderboardEntryData[];
}

export function BeamerFinished({
  leaderboard,
}: BeamerFinishedProps): React.ReactElement {
  const winner = leaderboard[0];

  return (
    <div className="w-full max-w-4xl space-y-8">
      <h1 className="text-5xl font-bold text-center text-correct">
        Spiel beendet!
      </h1>
      <h2 className="text-3xl text-center text-muted-foreground mb-8">
        Endstand
      </h2>

      {winner && (
        <div className="text-center mb-8">
          <p className="text-2xl text-muted-foreground">Gewinner</p>
          <p className="text-6xl font-bold text-yellow-500 mt-2">
            {winner.teamName}
          </p>
          <p className="text-4xl font-mono font-bold text-secondary mt-4">
            {winner.score.toLocaleString("de-DE")} Punkte
          </p>
        </div>
      )}

      <LeaderboardBeamer entries={leaderboard} />
    </div>
  );
}
