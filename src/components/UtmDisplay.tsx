"use client";

import { cn } from "@/lib/utils";

interface UtmDisplayProps {
  /** UTM zone string (e.g., "32U") */
  utmZone: string;
  /** Full easting value */
  easting: number;
  /** Full northing value */
  northing: number;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl";
  /** Whether to highlight the last 3 digits */
  highlightLast3?: boolean;
  /** Additional class name */
  className?: string;
}

export function UtmDisplay({
  utmZone,
  easting,
  northing,
  size = "md",
  highlightLast3 = true,
  className,
}: UtmDisplayProps) {
  const sizeConfig = {
    sm: { zone: "text-sm", coord: "text-lg", label: "text-xs" },
    md: { zone: "text-base", coord: "text-2xl", label: "text-sm" },
    lg: { zone: "text-lg", coord: "text-4xl", label: "text-base" },
    xl: { zone: "text-xl", coord: "text-6xl", label: "text-lg" },
  };

  const config = sizeConfig[size];

  // Split coordinates into km part and meter part
  const eastingKm = Math.floor(easting / 1000);
  const eastingM = Math.floor(easting % 1000);
  const northingKm = Math.floor(northing / 1000);
  const northingM = Math.floor(northing % 1000);

  const formatMeters = (m: number) => m.toString().padStart(3, "0");

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 p-6 bg-card rounded-xl border border-secondary/30",
        className,
      )}
    >
      {/* Zone */}
      <div className={cn("text-secondary font-mono", config.zone)}>
        Zone {utmZone}
      </div>

      {/* Coordinates */}
      <div className="flex flex-col gap-3">
        {/* Easting */}
        <div className="flex items-center gap-2">
          <span className={cn("text-muted-foreground w-8", config.label)}>
            E
          </span>
          <span className={cn("font-mono tabular-nums", config.coord)}>
            {highlightLast3 ? (
              <>
                <span className="text-muted-foreground">{eastingKm}</span>
                <span className="text-secondary font-bold">
                  {formatMeters(eastingM)}
                </span>
              </>
            ) : (
              <span className="text-foreground">
                {eastingKm}
                {formatMeters(eastingM)}
              </span>
            )}
          </span>
        </div>

        {/* Northing */}
        <div className="flex items-center gap-2">
          <span className={cn("text-muted-foreground w-8", config.label)}>
            N
          </span>
          <span className={cn("font-mono tabular-nums", config.coord)}>
            {highlightLast3 ? (
              <>
                <span className="text-muted-foreground">{northingKm}</span>
                <span className="text-secondary font-bold">
                  {formatMeters(northingM)}
                </span>
              </>
            ) : (
              <span className="text-foreground">
                {northingKm}
                {formatMeters(northingM)}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Hint text */}
      {highlightLast3 && (
        <p className="text-xs text-muted-foreground text-center">
          Finde diesen Punkt auf der Karte
        </p>
      )}
    </div>
  );
}

/**
 * Compact UTM display for headers and small spaces
 */
export function UtmDisplayCompact({
  utmZone,
  easting,
  northing,
  className,
}: Pick<UtmDisplayProps, "utmZone" | "easting" | "northing" | "className">) {
  const eastingKm = Math.floor(easting / 1000);
  const eastingM = Math.floor(easting % 1000);
  const northingKm = Math.floor(northing / 1000);
  const northingM = Math.floor(northing % 1000);

  const formatMeters = (m: number) => m.toString().padStart(3, "0");

  return (
    <span className={cn("font-mono text-sm tabular-nums", className)}>
      <span className="text-secondary">{utmZone}</span>{" "}
      <span className="text-muted-foreground">{eastingKm}</span>
      <span className="text-secondary">{formatMeters(eastingM)}</span>
      {" / "}
      <span className="text-muted-foreground">{northingKm}</span>
      <span className="text-secondary">{formatMeters(northingM)}</span>
    </span>
  );
}

/**
 * UTM display showing only the last 3 digits (for game challenges)
 */
export function UtmDisplayShort({
  easting3,
  northing3,
  size = "lg",
  className,
}: {
  easting3: string;
  northing3: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizeConfig = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-6xl",
    xl: "text-8xl",
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="flex items-baseline gap-3">
        <span className="text-muted-foreground text-lg">E</span>
        <span
          className={cn(
            "font-mono font-bold tabular-nums text-secondary",
            sizeConfig[size],
          )}
        >
          {easting3}
        </span>
      </div>
      <div className="flex items-baseline gap-3">
        <span className="text-muted-foreground text-lg">N</span>
        <span
          className={cn(
            "font-mono font-bold tabular-nums text-secondary",
            sizeConfig[size],
          )}
        >
          {northing3}
        </span>
      </div>
    </div>
  );
}
