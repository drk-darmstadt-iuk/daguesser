"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TeamScoreCardProps {
  teamName: string;
  score: number;
  rank?: number;
  lastRoundScore?: number;
  lastRoundDistance?: number;
  isActive?: boolean;
  isHighlighted?: boolean;
  className?: string;
}

export function TeamScoreCard({
  teamName,
  score,
  rank,
  lastRoundScore,
  lastRoundDistance,
  isActive = true,
  isHighlighted = false,
  className,
}: TeamScoreCardProps) {
  const [animatedScore, setAnimatedScore] = useState(score);
  const [showScorePop, setShowScorePop] = useState(false);

  // Animate score changes
  useEffect(() => {
    if (score !== animatedScore) {
      setShowScorePop(true);
      const timeout = setTimeout(() => {
        setAnimatedScore(score);
        setShowScorePop(false);
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [score, animatedScore]);

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return { emoji: "", class: "text-yellow-500" };
    if (rank === 2) return { emoji: "", class: "text-gray-400" };
    if (rank === 3) return { emoji: "", class: "text-amber-700" };
    return { text: `${rank}.`, class: "text-muted-foreground" };
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all",
        isHighlighted && "border-secondary ring-2 ring-secondary/30",
        !isActive && "opacity-60",
        className,
      )}
    >
      {/* Rank badge */}
      {rank !== undefined && (
        <div
          className={cn(
            "absolute top-2 right-2 text-2xl",
            getRankDisplay(rank).class,
          )}
        >
          {"emoji" in getRankDisplay(rank)
            ? getRankDisplay(rank).emoji
            : getRankDisplay(rank).text}
        </div>
      )}

      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <span className={cn(isHighlighted && "text-secondary")}>
            {teamName}
          </span>
          {!isActive && (
            <Badge variant="outline" className="text-xs">
              Offline
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Score */}
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "font-mono font-bold text-4xl tabular-nums text-secondary",
              showScorePop && "score-pop",
            )}
          >
            {animatedScore.toLocaleString("de-DE")}
          </span>
          <span className="text-muted-foreground text-sm">Punkte</span>
        </div>

        {/* Last round info */}
        {lastRoundScore !== undefined && (
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Letzte Runde:</span>
              <span
                className={cn(
                  "font-mono font-bold",
                  lastRoundScore > 0 ? "text-correct" : "text-muted-foreground",
                )}
              >
                +{lastRoundScore}
              </span>
            </div>

            {lastRoundDistance !== undefined && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Entfernung:</span>
                <span className="font-mono text-secondary">
                  {lastRoundDistance < 1000
                    ? `${Math.round(lastRoundDistance)}m`
                    : `${(lastRoundDistance / 1000).toFixed(1)}km`}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact score display for headers
 */
export function TeamScoreCompact({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline gap-1", className)}>
      <span className="font-mono font-bold text-lg tabular-nums text-secondary">
        {score.toLocaleString("de-DE")}
      </span>
      <span className="text-xs text-muted-foreground">Pkt.</span>
    </div>
  );
}

/**
 * Score result display after a round
 */
export function RoundScoreResult({
  score,
  distanceMeters,
  rating,
  className,
}: {
  score: number;
  distanceMeters: number;
  rating: "perfect" | "excellent" | "good" | "fair" | "poor" | "miss";
  className?: string;
}) {
  const ratingConfig = {
    perfect: { label: "Perfekt!", emoji: "", class: "text-correct" },
    excellent: { label: "Ausgezeichnet!", emoji: "", class: "text-correct" },
    good: { label: "Gut!", emoji: "", class: "text-secondary" },
    fair: { label: "Nicht schlecht", emoji: "", class: "text-warning" },
    poor: { label: "Daneben", emoji: "", class: "text-muted-foreground" },
    miss: { label: "Weit daneben", emoji: "", class: "text-destructive" },
  };

  const config = ratingConfig[rating];

  return (
    <div className={cn("flex flex-col items-center gap-4 py-8", className)}>
      {/* Rating */}
      <div className={cn("text-4xl", config.class)}>
        {config.emoji}
      </div>
      <h3 className={cn("text-2xl font-bold", config.class)}>{config.label}</h3>

      {/* Score */}
      <div className="flex items-baseline gap-2">
        <span className="font-mono font-bold text-5xl tabular-nums text-secondary score-pop">
          +{score}
        </span>
        <span className="text-muted-foreground">Punkte</span>
      </div>

      {/* Distance */}
      <div className="flex items-center gap-2 text-muted-foreground">
        <span>Entfernung:</span>
        <span className="font-mono text-foreground">
          {distanceMeters < 1000
            ? `${Math.round(distanceMeters)} m`
            : `${(distanceMeters / 1000).toFixed(1)} km`}
        </span>
      </div>
    </div>
  );
}
