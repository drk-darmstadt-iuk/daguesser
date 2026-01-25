"use client";

import { Leaderboard } from "@/components/Leaderboard";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { LeaderboardEntryData, TeamData } from "./types";

interface TeamsSidebarProps {
  teams: TeamData[];
  leaderboard: LeaderboardEntryData[];
}

export function TeamsSidebar({
  teams,
  leaderboard,
}: TeamsSidebarProps): React.ReactElement {
  const activeTeams = teams.filter((t) => t.isActive);

  return (
    <div className="w-80 border-l border-border p-4">
      <h2 className="font-semibold mb-4">Leaderboard</h2>
      {leaderboard.length > 0 ? (
        <Leaderboard entries={leaderboard} showRoundScores size="sm" />
      ) : (
        <p className="text-sm text-muted-foreground">Noch keine Punkte</p>
      )}

      <Separator className="my-4" />

      <h3 className="font-semibold text-sm mb-2">
        Teams ({activeTeams.length})
      </h3>
      <div className="space-y-1">
        {activeTeams.map((team) => (
          <div
            key={team._id}
            className="flex items-center justify-between text-sm"
          >
            <span>{team.name}</span>
            <Badge variant="outline" className="font-mono text-xs">
              {team.score}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
