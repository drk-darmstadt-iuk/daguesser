"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  /** Timestamp when countdown ends (ms) */
  endsAt: number;
  /** Total duration in seconds */
  totalSeconds: number;
  /** Called when countdown reaches zero */
  onComplete?: () => void;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl";
  /** Show milliseconds */
  showMs?: boolean;
  /** Custom class name */
  className?: string;
}

export function CountdownTimer({
  endsAt,
  totalSeconds,
  onComplete,
  size = "md",
  showMs = false,
  className,
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState<number>(
    Math.max(0, endsAt - Date.now()),
  );

  useEffect(() => {
    const interval = setInterval(
      () => {
        const now = Date.now();
        const newRemaining = Math.max(0, endsAt - now);
        setRemaining(newRemaining);

        if (newRemaining === 0) {
          clearInterval(interval);
          onComplete?.();
        }
      },
      showMs ? 50 : 100,
    );

    return () => clearInterval(interval);
  }, [endsAt, onComplete, showMs]);

  const seconds = Math.ceil(remaining / 1000);
  const progress = remaining / (totalSeconds * 1000);
  const isLowTime = seconds <= 10;
  const isCritical = seconds <= 5;

  // Size configurations
  const sizeConfig = {
    sm: { size: 80, stroke: 4, fontSize: "text-2xl" },
    md: { size: 120, stroke: 6, fontSize: "text-4xl" },
    lg: { size: 180, stroke: 8, fontSize: "text-6xl" },
    xl: { size: 240, stroke: 10, fontSize: "text-7xl" },
  };

  const config = sizeConfig[size];
  const radius = (config.size - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  // Format time display
  const formatTime = () => {
    if (showMs) {
      const ms = Math.floor((remaining % 1000) / 10);
      return `${seconds}.${ms.toString().padStart(2, "0")}`;
    }
    return seconds.toString();
  };

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className,
      )}
      style={{ width: config.size, height: config.size }}
    >
      {/* Background circle */}
      <svg
        className="absolute transform -rotate-90"
        width={config.size}
        height={config.size}
        aria-hidden="true"
      >
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={config.stroke}
          fill="none"
          className="text-muted/30"
        />
        {/* Progress circle */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={config.stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn(
            "transition-all duration-100",
            isCritical
              ? "text-primary"
              : isLowTime
                ? "text-warning"
                : "text-secondary",
          )}
        />
      </svg>

      {/* Time display */}
      <span
        className={cn(
          "font-mono font-bold tabular-nums",
          config.fontSize,
          isCritical && "text-primary countdown-pulse",
          isLowTime && !isCritical && "text-warning",
          !isLowTime && "text-foreground",
        )}
      >
        {formatTime()}
      </span>
    </div>
  );
}

/**
 * Static countdown display (no animation, just shows time)
 */
export function CountdownDisplay({
  seconds,
  size = "md",
  className,
}: {
  seconds: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizeConfig = {
    sm: { fontSize: "text-2xl" },
    md: { fontSize: "text-4xl" },
    lg: { fontSize: "text-6xl" },
    xl: { fontSize: "text-7xl" },
  };

  return (
    <span
      className={cn(
        "font-mono font-bold tabular-nums text-muted-foreground",
        sizeConfig[size].fontSize,
        className,
      )}
    >
      {seconds}s
    </span>
  );
}
