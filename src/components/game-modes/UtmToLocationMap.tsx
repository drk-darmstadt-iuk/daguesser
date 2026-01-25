"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CountdownTimer } from "@/components/CountdownTimer";
import { MapPlanZeiger } from "@/components/MapPlanZeiger";
import { UtmDisplayCompact } from "@/components/UtmDisplay";
import { UtmGridOverlay } from "@/components/UtmGridOverlay";
import { Button } from "@/components/ui/button";
import { Map, MapControls, type MapRef } from "@/components/ui/map";
import { cn } from "@/lib/utils";
import { DARMSTADT_CENTER, latLngToUtm } from "@/lib/utm";

interface UtmToLocationMapProps {
  /** Target UTM coordinates to display */
  targetUtm: {
    zone: string;
    easting: number;
    northing: number;
  };
  /** Countdown end timestamp */
  countdownEndsAt: number | null;
  /** Total time limit in seconds */
  timeLimit: number;
  /** Whether submission is in progress */
  isSubmitting: boolean;
  /** Submit error message */
  submitError: string | null;
  /** Called when position changes */
  onPositionChange: (position: { lat: number; lng: number }) => void;
  /** Called when user submits */
  onSubmit: () => void;
  /** Additional class name */
  className?: string;
}

/**
 * Interactive map for the utmToLocation game mode.
 *
 * Displays a map with UTM grid overlay and a draggable crosshair.
 * The user pans the map to position the crosshair over their guess.
 */
export function UtmToLocationMap({
  targetUtm,
  countdownEndsAt,
  timeLimit,
  isSubmitting,
  submitError,
  onPositionChange,
  onSubmit,
  className,
}: UtmToLocationMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [currentUtm, setCurrentUtm] = useState<{
    zone: string;
    easting: number;
    northing: number;
  } | null>(null);
  const [hasPosition, setHasPosition] = useState(false);

  // Update current position when map moves
  const updateCurrentPosition = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const center = map.getCenter();
    const utm = latLngToUtm(center.lat, center.lng);

    setCurrentUtm({
      zone: `${utm.zone}${utm.zoneLetter || utm.hemisphere}`,
      easting: utm.easting,
      northing: utm.northing,
    });

    onPositionChange({ lat: center.lat, lng: center.lng });
    setHasPosition(true);
  }, [onPositionChange]);

  // Handle position change from MapPlanZeiger (pan the map)
  const handlePlanZeigerMove = useCallback(
    (position: { x: number; y: number }) => {
      const map = mapRef.current;
      if (!map) return;

      const container = map.getContainer();
      const centerX = container.clientWidth / 2;
      const centerY = container.clientHeight / 2;

      // Calculate delta from center
      const deltaX = centerX - position.x;
      const deltaY = centerY - position.y;

      // Only pan if there's actual movement
      if (deltaX !== 0 || deltaY !== 0) {
        map.panBy([deltaX, deltaY], { duration: 0 });
      }
    },
    [],
  );

  // Set up map event listeners
  const handleMapLoad = useCallback(
    (map: MapRef) => {
      mapRef.current = map;

      // Update position on map move
      map.on("moveend", updateCurrentPosition);
      map.on("zoomend", updateCurrentPosition);

      // Initial position update
      updateCurrentPosition();
    },
    [updateCurrentPosition],
  );

  // Cleanup map listeners
  useEffect(() => {
    return () => {
      const map = mapRef.current;
      if (map) {
        map.off("moveend", updateCurrentPosition);
        map.off("zoomend", updateCurrentPosition);
      }
    };
  }, [updateCurrentPosition]);

  return (
    <div className={cn("flex flex-col gap-4 w-full", className)}>
      {/* Target UTM display */}
      <div className="flex items-center justify-center gap-2 px-4 py-3 bg-card rounded-xl border border-secondary/30">
        <span className="text-sm text-muted-foreground">Ziel:</span>
        <UtmDisplayCompact
          utmZone={targetUtm.zone}
          easting={targetUtm.easting}
          northing={targetUtm.northing}
          className="text-base"
        />
      </div>

      {/* Map container */}
      <div className="relative flex-1 min-h-[350px] md:min-h-[450px] rounded-xl overflow-hidden border border-border">
        <Map
          ref={handleMapLoad}
          center={[DARMSTADT_CENTER.longitude, DARMSTADT_CENTER.latitude]}
          zoom={15}
          minZoom={10}
          maxZoom={18}
        >
          <UtmGridOverlay />
          <MapControls position="bottom-left" showZoom showLocate />
        </Map>

        {/* Planzeiger overlay */}
        <MapPlanZeiger
          onPositionChange={handlePlanZeigerMove}
          size={140}
          showHint={!hasPosition}
        />

        {/* Timer overlay */}
        {countdownEndsAt && (
          <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2">
            <CountdownTimer
              endsAt={countdownEndsAt}
              totalSeconds={timeLimit}
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Current position display */}
      <div className="flex items-center justify-center gap-2 px-4 py-2 bg-card/50 rounded-lg">
        <span className="text-xs text-muted-foreground">
          Aktuelle Position:
        </span>
        {currentUtm ? (
          <UtmDisplayCompact
            utmZone={currentUtm.zone}
            easting={currentUtm.easting}
            northing={currentUtm.northing}
            className="text-sm"
          />
        ) : (
          <span className="text-sm text-muted-foreground">---</span>
        )}
      </div>

      {/* Error message */}
      {submitError && (
        <p className="text-sm text-destructive text-center">{submitError}</p>
      )}

      {/* Submit button */}
      <Button
        size="lg"
        className={cn(
          "w-full font-bold",
          hasPosition && !isSubmitting && "submit-ready",
        )}
        disabled={!hasPosition || isSubmitting}
        onClick={onSubmit}
      >
        {isSubmitting ? "Wird gesendet..." : "ABGEBEN"}
      </Button>
    </div>
  );
}
