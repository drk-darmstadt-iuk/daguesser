"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  teamId: string;
  teamName: string;
  score: number;
  rank: number;
  isActive: boolean;
  roundScores?: Array<{
    roundNumber: number;
    score: number;
    distanceMeters: number;
  }>;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  /** Highlight a specific team */
  highlightTeamId?: string;
  /** Show only top N entries */
  maxEntries?: number;
  /** Show detailed round scores */
  showRoundScores?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Custom class name */
  className?: string;
}

export function Leaderboard({
  entries,
  highlightTeamId,
  maxEntries,
  showRoundScores = false,
  size = "md",
  className,
}: LeaderboardProps) {
  const displayEntries = maxEntries ? entries.slice(0, maxEntries) : entries;

  const sizeConfig = {
    sm: { text: "text-sm", padding: "p-2", score: "text-base" },
    md: { text: "text-base", padding: "p-3", score: "text-lg" },
    lg: { text: "text-lg", padding: "p-4", score: "text-2xl" },
  };

  const config = sizeConfig[size];

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return { emoji: "", class: "text-yellow-500" };
    if (rank === 2) return { emoji: "", class: "text-gray-400" };
    if (rank === 3) return { emoji: "", class: "text-amber-700" };
    return { emoji: `${rank}.`, class: "text-muted-foreground" };
  };

  return (
    <div className={cn("rounded-lg border border-border bg-card", className)}>
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className={cn("w-16", config.padding, config.text)}>
              Rang
            </TableHead>
            <TableHead className={cn(config.padding, config.text)}>
              Team
            </TableHead>
            <TableHead
              className={cn("text-right", config.padding, config.text)}
            >
              Punkte
            </TableHead>
            {showRoundScores && (
              <TableHead
                className={cn("text-right", config.padding, config.text)}
              >
                Letzte Runde
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayEntries.map((entry, index) => {
            const rankDisplay = getRankDisplay(entry.rank);
            const isHighlighted = entry.teamId === highlightTeamId;
            const lastRound = entry.roundScores?.[entry.roundScores.length - 1];

            return (
              <TableRow
                key={entry.teamId}
                className={cn(
                  "border-border transition-colors",
                  isHighlighted && "bg-secondary/10",
                  !entry.isActive && "opacity-50",
                )}
              >
                <TableCell
                  className={cn(
                    "font-mono font-bold",
                    config.padding,
                    rankDisplay.class,
                  )}
                >
                  {rankDisplay.emoji}
                </TableCell>
                <TableCell className={cn(config.padding, config.text)}>
                  <div className="flex items-center gap-2">
                    <span className={cn(isHighlighted && "font-semibold")}>
                      {entry.teamName}
                    </span>
                    {!entry.isActive && (
                      <Badge variant="outline" className="text-xs">
                        Offline
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-mono font-bold tabular-nums",
                    config.padding,
                    config.score,
                    entry.score > 0
                      ? "text-secondary"
                      : "text-muted-foreground",
                  )}
                >
                  {entry.score.toLocaleString("de-DE")}
                </TableCell>
                {showRoundScores && (
                  <TableCell
                    className={cn(
                      "text-right font-mono text-sm tabular-nums",
                      config.padding,
                    )}
                  >
                    {lastRound ? (
                      <span
                        className={cn(
                          lastRound.score > 0
                            ? "text-correct"
                            : "text-muted-foreground",
                        )}
                      >
                        +{lastRound.score}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}

          {displayEntries.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={showRoundScores ? 4 : 3}
                className="text-center text-muted-foreground py-8"
              >
                Noch keine Teams beigetreten
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Compact leaderboard for smaller spaces
 */
export function LeaderboardCompact({
  entries,
  highlightTeamId,
  maxEntries = 5,
  className,
}: Pick<
  LeaderboardProps,
  "entries" | "highlightTeamId" | "maxEntries" | "className"
>) {
  const displayEntries = entries.slice(0, maxEntries);

  return (
    <div className={cn("space-y-2", className)}>
      {displayEntries.map((entry) => {
        const isHighlighted = entry.teamId === highlightTeamId;
        return (
          <div
            key={entry.teamId}
            className={cn(
              "flex items-center justify-between px-3 py-2 rounded-lg",
              isHighlighted ? "bg-secondary/10" : "bg-card",
            )}
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-muted-foreground w-6">
                {entry.rank}.
              </span>
              <span
                className={cn(
                  "text-sm",
                  isHighlighted && "font-semibold text-secondary",
                )}
              >
                {entry.teamName}
              </span>
            </div>
            <span className="font-mono text-sm font-bold tabular-nums text-secondary">
              {entry.score}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Beamer-optimized full-screen leaderboard
 */
export function LeaderboardBeamer({
  entries,
  showRoundScores = false,
  className,
}: Pick<LeaderboardProps, "entries" | "showRoundScores" | "className">) {
  return (
    <Leaderboard
      entries={entries}
      showRoundScores={showRoundScores}
      size="lg"
      className={cn("text-xl", className)}
    />
  );
}
