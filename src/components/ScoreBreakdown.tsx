"use client";

import { cn } from "@/lib/utils";

interface ScoreBreakdownProps {
  /** Total score (displayed prominently) */
  score: number;
  /** Distance-based score component (0-1000) */
  distanceScore?: number;
  /** Time bonus component (0-100) */
  timeBonus?: number;
  /** Additional class name */
  className?: string;
  /** Whether to animate the score on mount */
  animate?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

/**
 * Displays score with optional breakdown of components.
 *
 * Shows total score prominently with subtle breakdown below
 * when distanceScore and timeBonus are provided.
 */
export function ScoreBreakdown({
  score,
  distanceScore,
  timeBonus,
  className,
  animate = true,
  size = "md",
}: ScoreBreakdownProps) {
  const hasBreakdown =
    distanceScore !== undefined && timeBonus !== undefined && timeBonus > 0;

  const sizeStyles = {
    sm: {
      total: "text-3xl",
      breakdown: "text-xs",
      label: "text-xs",
    },
    md: {
      total: "text-5xl",
      breakdown: "text-sm",
      label: "text-sm",
    },
    lg: {
      total: "text-6xl",
      breakdown: "text-base",
      label: "text-base",
    },
  };

  const styles = sizeStyles[size];

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {/* Total score - prominent display */}
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "font-mono font-bold tabular-nums text-secondary",
            styles.total,
            animate && "score-pop",
          )}
        >
          +{score}
        </span>
        <span className={cn("text-muted-foreground", styles.label)}>
          Punkte
        </span>
      </div>

      {/* Score breakdown - subtle, informational */}
      {hasBreakdown && (
        <div
          className={cn(
            "flex flex-col gap-1 text-muted-foreground w-full max-w-[200px]",
            styles.breakdown,
          )}
        >
          <div className="flex justify-between font-mono">
            <span>Genauigkeit:</span>
            <span className="text-foreground">+{distanceScore}</span>
          </div>
          <div className="flex justify-between font-mono">
            <span>Geschwindigkeit:</span>
            <span className="text-secondary">+{timeBonus}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact inline score breakdown for use in cards/lists.
 */
export function ScoreBreakdownInline({
  distanceScore,
  timeBonus,
  className,
}: {
  distanceScore?: number;
  timeBonus?: number;
  className?: string;
}) {
  if (distanceScore === undefined || timeBonus === undefined) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 text-xs text-muted-foreground font-mono",
        className,
      )}
    >
      <span>
        Genauigkeit: <span className="text-foreground">+{distanceScore}</span>
      </span>
      {timeBonus > 0 && (
        <span>
          Tempo: <span className="text-secondary">+{timeBonus}</span>
        </span>
      )}
    </div>
  );
}
