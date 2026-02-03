"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  COMPASS_DIRECTIONS,
  formatBearing,
  formatDistance,
} from "@/lib/bearing";
import { cn } from "@/lib/utils";

interface DirectionDistanceDisplayProps {
  /** Bearing in degrees (0-360, clockwise from north) */
  bearingDegrees: number;
  /** Distance in meters */
  distanceMeters: number;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional class name */
  className?: string;
  /** Whether to show compass legend tooltip */
  showLegend?: boolean;
}

/**
 * Displays direction and distance with a rotating compass arrow.
 *
 * Shows:
 * - Rotating arrow pointing in the direction
 * - German compass direction (N, NO, O, SO, S, SW, W, NW)
 * - Bearing in degrees
 * - Distance in meters/km
 */
export function DirectionDistanceDisplay({
  bearingDegrees,
  distanceMeters,
  size = "md",
  className,
  showLegend = true,
}: DirectionDistanceDisplayProps) {
  const compassDirection = formatBearing(bearingDegrees);
  const formattedDistance = formatDistance(distanceMeters);

  const sizeStyles = {
    sm: {
      arrow: "text-4xl",
      direction: "text-xl",
      distance: "text-lg",
    },
    md: {
      arrow: "text-6xl",
      direction: "text-3xl",
      distance: "text-2xl",
    },
    lg: {
      arrow: "text-8xl",
      direction: "text-4xl",
      distance: "text-3xl",
    },
  };

  const styles = sizeStyles[size];

  const arrowContent = (
    <div
      className={cn(
        "text-secondary transition-transform duration-500",
        styles.arrow,
      )}
      style={{ transform: `rotate(${bearingDegrees}deg)` }}
      role="img"
      aria-label={`Richtung ${compassDirection}, ${bearingDegrees} Grad`}
    >
      ↑
    </div>
  );

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {/* Rotating arrow with optional legend tooltip */}
      {showLegend ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{arrowContent}</TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <CompassLegend />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        arrowContent
      )}

      {/* Bearing text */}
      <div
        className={cn("font-mono font-bold text-secondary", styles.direction)}
      >
        {compassDirection} ({bearingDegrees}°)
      </div>

      {/* Distance */}
      <div className={cn("font-mono font-bold", styles.distance)}>
        {formattedDistance}
      </div>
    </div>
  );
}

/**
 * Compact version for inline display.
 */
export function DirectionDistanceCompact({
  bearingDegrees,
  distanceMeters,
  className,
}: {
  bearingDegrees: number;
  distanceMeters: number;
  className?: string;
}) {
  const compassDirection = formatBearing(bearingDegrees);
  const formattedDistance = formatDistance(distanceMeters);

  return (
    <div
      className={cn(
        "flex items-center gap-3 font-mono text-secondary",
        className,
      )}
    >
      <span
        className="inline-block transition-transform"
        style={{ transform: `rotate(${bearingDegrees}deg)` }}
        aria-hidden="true"
      >
        ↑
      </span>
      <span className="font-bold">
        {compassDirection} ({bearingDegrees}°)
      </span>
      <span className="text-foreground">{formattedDistance}</span>
    </div>
  );
}

/**
 * Compass legend showing all direction abbreviations.
 */
function CompassLegend(): React.ReactElement {
  return (
    <div className="text-xs">
      <p className="font-semibold mb-2">Himmelsrichtungen:</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {COMPASS_DIRECTIONS.map((dir) => (
          <div key={dir.label} className="flex gap-2">
            <span className="font-mono font-bold text-secondary w-6">
              {dir.label}
            </span>
            <span className="text-muted-foreground">{dir.full}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
