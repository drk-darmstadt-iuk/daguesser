"use client";

import { useEffect } from "react";
import { CrosshairMarkerIcon } from "@/components/MapPlanZeiger";
import { UtmGridOverlay } from "@/components/UtmGridOverlay";
import { Badge } from "@/components/ui/badge";
import {
  Map,
  MapControls,
  MapMarker,
  MapRoute,
  MarkerContent,
  MarkerLabel,
  useMap,
} from "@/components/ui/map";
import { formatDistanceShort, getDistanceRating } from "@/lib/scoring";
import { cn } from "@/lib/utils";

interface Position {
  lat: number;
  lng: number;
}

interface TeamGuess {
  teamName: string;
  position: Position;
  score: number;
  distanceMeters: number;
}

interface LocationSolutionMapProps {
  /** Correct position */
  correctPosition: Position;
  /** User's guessed position (for player view) */
  guessedPosition?: Position | null;
  /** All team guesses (for beamer view) */
  teamGuesses?: TeamGuess[];
  /** Whether to show distance line */
  showDistanceLine?: boolean;
  /** Whether to show UTM grid */
  showUtmGrid?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * Reusable map component for showing solution/reveal.
 *
 * Shows the correct position, guessed position(s), and optionally
 * a distance line between them.
 */
export function LocationSolutionMap({
  correctPosition,
  guessedPosition,
  teamGuesses,
  showDistanceLine = true,
  showUtmGrid = true,
  className,
}: LocationSolutionMapProps) {
  // Build route coordinates for distance line
  const distanceLineCoordinates: [number, number][] =
    showDistanceLine && guessedPosition
      ? [
          [correctPosition.lng, correctPosition.lat],
          [guessedPosition.lng, guessedPosition.lat],
        ]
      : [];

  return (
    <div
      className={cn(
        "relative w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden border border-border",
        className,
      )}
    >
      <Map
        center={[correctPosition.lng, correctPosition.lat]}
        zoom={15}
        minZoom={10}
        maxZoom={18}
      >
        {/* Fit bounds to all markers on load */}
        <MapBoundsFitter
          correctPosition={correctPosition}
          guessedPosition={guessedPosition}
          teamGuesses={teamGuesses}
        />
        {showUtmGrid && <UtmGridOverlay lineOpacity={0.2} />}
        <MapControls position="bottom-right" showZoom />

        {/* Distance line */}
        {distanceLineCoordinates.length === 2 && (
          <MapRoute
            coordinates={distanceLineCoordinates}
            color="#E31E24"
            width={2}
            opacity={0.8}
            dashArray={[8, 4]}
            interactive={false}
          />
        )}

        {/* Correct position marker */}
        <MapMarker
          longitude={correctPosition.lng}
          latitude={correctPosition.lat}
        >
          <MarkerContent className="pin-drop">
            <div className="relative">
              <div className="absolute -inset-2 rounded-full bg-correct/20 animate-pulse" />
              <CrosshairMarkerIcon color="correct" size={36} />
            </div>
          </MarkerContent>
          <MarkerLabel position="bottom" className="text-correct font-semibold">
            LOESUNG
          </MarkerLabel>
        </MapMarker>

        {/* User's guessed position */}
        {guessedPosition && (
          <MapMarker
            longitude={guessedPosition.lng}
            latitude={guessedPosition.lat}
          >
            <MarkerContent className="pin-drop [animation-delay:200ms]">
              <CrosshairMarkerIcon color="destructive" size={28} />
            </MarkerContent>
            <MarkerLabel
              position="bottom"
              className="text-destructive font-medium"
            >
              Dein Tipp
            </MarkerLabel>
          </MapMarker>
        )}

        {/* Team guesses (for beamer view) */}
        {teamGuesses?.map((guess) => (
          <MapMarker
            key={guess.teamName}
            longitude={guess.position.lng}
            latitude={guess.position.lat}
          >
            <MarkerContent className="pin-drop">
              <CrosshairMarkerIcon color="destructive" size={24} />
            </MarkerContent>
            <MarkerLabel position="bottom" className="text-xs text-foreground">
              {guess.teamName}
            </MarkerLabel>
          </MapMarker>
        ))}
      </Map>
    </div>
  );
}

/**
 * Internal component to fit map bounds to all markers
 */
function MapBoundsFitter({
  correctPosition,
  guessedPosition,
  teamGuesses,
}: {
  correctPosition: Position;
  guessedPosition?: Position | null;
  teamGuesses?: TeamGuess[];
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!isLoaded || !map) return;

    // Delay to allow markers to render
    const timeout = setTimeout(() => {
      const positions: Position[] = [correctPosition];

      if (guessedPosition) {
        positions.push(guessedPosition);
      }

      if (teamGuesses) {
        positions.push(...teamGuesses.map((g) => g.position));
      }

      if (positions.length === 1) {
        // Single position - just center on it
        map.flyTo({
          center: [positions[0].lng, positions[0].lat],
          zoom: 16,
          duration: 1000,
        });
        return;
      }

      // Calculate bounds
      let minLng = Number.POSITIVE_INFINITY;
      let maxLng = Number.NEGATIVE_INFINITY;
      let minLat = Number.POSITIVE_INFINITY;
      let maxLat = Number.NEGATIVE_INFINITY;

      for (const pos of positions) {
        minLng = Math.min(minLng, pos.lng);
        maxLng = Math.max(maxLng, pos.lng);
        minLat = Math.min(minLat, pos.lat);
        maxLat = Math.max(maxLat, pos.lat);
      }

      // Add some padding
      const lngPadding = (maxLng - minLng) * 0.2 || 0.001;
      const latPadding = (maxLat - minLat) * 0.2 || 0.001;

      map.fitBounds(
        [
          [minLng - lngPadding, minLat - latPadding],
          [maxLng + lngPadding, maxLat + latPadding],
        ] as [[number, number], [number, number]],
        { padding: 50, duration: 1000 },
      );
    }, 100);

    return () => clearTimeout(timeout);
  }, [isLoaded, map, correctPosition, guessedPosition, teamGuesses]);

  return null;
}

/**
 * Distance display card for showing how far off the guess was
 */
export function DistanceDisplay({
  distanceMeters,
  className,
}: {
  distanceMeters: number;
  className?: string;
}) {
  const rating = getDistanceRating(distanceMeters);

  const ratingStyles = {
    perfect: "bg-correct/20 text-correct border-correct/30",
    excellent: "bg-correct/15 text-correct border-correct/20",
    good: "bg-secondary/20 text-secondary border-secondary/30",
    fair: "bg-warning/20 text-warning border-warning/30",
    poor: "bg-destructive/20 text-destructive border-destructive/30",
    miss: "bg-muted text-muted-foreground border-muted",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-6 py-3 rounded-xl border",
        ratingStyles[rating.rating],
        className,
      )}
    >
      <span className="text-3xl font-mono font-bold">
        {formatDistanceShort(distanceMeters)}
      </span>
      <span className="text-sm opacity-70">daneben</span>
      <Badge variant="outline" className="ml-auto">
        {rating.label}
      </Badge>
    </div>
  );
}
