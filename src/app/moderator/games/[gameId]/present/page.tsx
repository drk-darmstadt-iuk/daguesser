"use client";

import { useQuery } from "convex/react";
import { use } from "react";
import { GameHeaderBeamer } from "@/components/GameHeader";
import {
  BeamerFinished,
  BeamerLobby,
  BeamerPaused,
  BeamerRoundContent,
} from "@/components/moderator";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

function BeamerView({ gameId }: { gameId: Id<"games"> }): React.ReactElement {
  const game = useQuery(api.games.get, { gameId });
  const currentRound = useQuery(api.rounds.getCurrent, { gameId });
  const leaderboard = useQuery(api.leaderboard.get, { gameId });
  const roundGuesses = useQuery(
    api.guesses.getForRound,
    currentRound?._id &&
      (currentRound.status === "reveal" || currentRound.status === "completed")
      ? { roundId: currentRound._id }
      : "skip",
  );

  if (!game) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-2xl">Wird geladen...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-background overflow-hidden">
      <GameHeaderBeamer
        roundNumber={currentRound?.roundNumber}
        totalRounds={game.totalRounds}
        joinCode={game.joinCode}
      />

      <div className="flex-1 flex items-center justify-center p-8">
        {game.status === "lobby" && (
          <BeamerLobby
            joinCode={game.joinCode}
            teamCount={game.teamCount ?? 0}
          />
        )}

        {game.status === "playing" && currentRound && (
          <div className="w-full max-w-6xl space-y-8">
            <div className="text-center space-y-4">
              <BeamerRoundContent
                status={currentRound.status}
                mode={currentRound.mode}
                location={currentRound.location ?? undefined}
                timeLimit={currentRound.timeLimit}
                countdownEndsAt={currentRound.countdownEndsAt}
                guessCount={currentRound.guessCount ?? 0}
                totalTeams={currentRound.totalTeams ?? 0}
                allTeamsGuessed={currentRound.allTeamsGuessed}
                leaderboard={leaderboard ?? []}
                roundGuesses={roundGuesses ?? []}
                mcShuffledOptions={currentRound.mcShuffledOptions}
                mcCorrectIndex={currentRound.mcCorrectIndex}
              />
            </div>
          </div>
        )}

        {game.status === "paused" && <BeamerPaused />}

        {game.status === "finished" && leaderboard && (
          <BeamerFinished leaderboard={leaderboard} />
        )}
      </div>

      <footer className="text-center py-4 text-muted-foreground text-sm">
        DAGuesser - DRK Darmstadt IuK
      </footer>
    </main>
  );
}

export default function BeamerPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}): React.ReactElement {
  const { gameId } = use(params);

  return <BeamerView gameId={gameId as Id<"games">} />;
}
