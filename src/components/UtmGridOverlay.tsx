"use client";

import { useEffect, useId } from "react";
import { useMap } from "@/components/ui/map";
import { latLngToUtm, utmToLatLng } from "@/lib/utm";

interface UtmGridOverlayProps {
  /** Whether to show grid labels (default: true) */
  showLabels?: boolean;
  /** Grid line color (default: UTM cyan) */
  lineColor?: string;
  /** Grid line opacity (default: 0.3) */
  lineOpacity?: number;
}

/**
 * UTM Grid Overlay for MapLibreGL
 *
 * Renders 1km UTM grid lines dynamically based on map bounds.
 * Labels show UTM coordinate values (e.g., "477", "478").
 */
export function UtmGridOverlay({
  showLabels = true,
  lineColor = "#00D9FF",
  lineOpacity = 0.3,
}: UtmGridOverlayProps) {
  const { map, isLoaded } = useMap();
  const id = useId();
  const sourceId = `utm-grid-source-${id}`;
  const linesLayerId = `utm-grid-lines-${id}`;
  const labelsLayerId = `utm-grid-labels-${id}`;

  useEffect(() => {
    if (!isLoaded || !map) return;

    // Add source
    map.addSource(sourceId, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    });

    // Add lines layer
    map.addLayer({
      id: linesLayerId,
      type: "line",
      source: sourceId,
      filter: ["==", ["get", "type"], "line"],
      paint: {
        "line-color": lineColor,
        "line-width": 1,
        "line-opacity": lineOpacity,
      },
    });

    // Add labels layer
    if (showLabels) {
      map.addLayer({
        id: labelsLayerId,
        type: "symbol",
        source: sourceId,
        filter: ["==", ["get", "type"], "label"],
        layout: {
          "text-field": ["get", "label"],
          "text-size": 11,
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-anchor": "center",
          "text-allow-overlap": false,
          "text-ignore-placement": false,
        },
        paint: {
          "text-color": lineColor,
          "text-opacity": 0.7,
          "text-halo-color": "rgba(0, 0, 0, 0.8)",
          "text-halo-width": 1,
        },
      });
    }

    // Update grid on map move
    const updateGrid = () => {
      const bounds = map.getBounds();
      if (!bounds) return;

      const features = generateUtmGridFeatures(
        bounds.getSouth(),
        bounds.getWest(),
        bounds.getNorth(),
        bounds.getEast(),
        showLabels,
      );

      const source = map.getSource(sourceId) as maplibregl.GeoJSONSource;
      if (source) {
        source.setData({
          type: "FeatureCollection",
          features,
        });
      }
    };

    // Initial update
    updateGrid();

    // Update on move/zoom
    map.on("moveend", updateGrid);
    map.on("zoomend", updateGrid);

    return () => {
      map.off("moveend", updateGrid);
      map.off("zoomend", updateGrid);

      try {
        if (showLabels && map.getLayer(labelsLayerId)) {
          map.removeLayer(labelsLayerId);
        }
        if (map.getLayer(linesLayerId)) map.removeLayer(linesLayerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isLoaded,
    map,
    labelsLayerId,
    lineColor,
    lineOpacity,
    linesLayerId,
    showLabels,
    sourceId,
  ]);

  // Update style properties when props change
  useEffect(() => {
    if (!isLoaded || !map) return;

    if (map.getLayer(linesLayerId)) {
      map.setPaintProperty(linesLayerId, "line-color", lineColor);
      map.setPaintProperty(linesLayerId, "line-opacity", lineOpacity);
    }
    if (showLabels && map.getLayer(labelsLayerId)) {
      map.setPaintProperty(labelsLayerId, "text-color", lineColor);
    }
  }, [
    isLoaded,
    map,
    lineColor,
    lineOpacity,
    showLabels,
    linesLayerId,
    labelsLayerId,
  ]);

  return null;
}

/**
 * Generate GeoJSON features for UTM 1km grid lines
 */
function generateUtmGridFeatures(
  south: number,
  west: number,
  north: number,
  east: number,
  includeLabels: boolean,
): GeoJSON.Feature[] {
  const features: GeoJSON.Feature[] = [];

  // Get UTM coordinates for bounds corners
  const swUtm = latLngToUtm(south, west);
  const neUtm = latLngToUtm(north, east);

  // Only generate grid if both corners are in the same zone
  if (swUtm.zone !== neUtm.zone) {
    return features;
  }

  const zone = swUtm.zone;
  const hemisphere = swUtm.hemisphere;

  // Round to 1km boundaries
  const minEasting = Math.floor(swUtm.easting / 1000) * 1000;
  const maxEasting = Math.ceil(neUtm.easting / 1000) * 1000;
  const minNorthing = Math.floor(swUtm.northing / 1000) * 1000;
  const maxNorthing = Math.ceil(neUtm.northing / 1000) * 1000;

  // Limit grid lines to prevent performance issues
  const maxLines = 50;
  const eastingStep = Math.max(
    1000,
    Math.ceil((maxEasting - minEasting) / maxLines / 1000) * 1000,
  );
  const northingStep = Math.max(
    1000,
    Math.ceil((maxNorthing - minNorthing) / maxLines / 1000) * 1000,
  );

  // Generate vertical lines (constant easting)
  for (
    let easting = minEasting;
    easting <= maxEasting;
    easting += eastingStep
  ) {
    const coordinates: [number, number][] = [];

    // Generate points along the line
    for (let northing = minNorthing; northing <= maxNorthing; northing += 500) {
      const latLng = utmToLatLng({
        zone,
        hemisphere,
        easting,
        northing,
      });
      coordinates.push([latLng.longitude, latLng.latitude]);
    }

    if (coordinates.length >= 2) {
      features.push({
        type: "Feature",
        properties: { type: "line", direction: "vertical", value: easting },
        geometry: { type: "LineString", coordinates },
      });

      // Add label at the bottom of the line
      if (includeLabels) {
        const labelLatLng = utmToLatLng({
          zone,
          hemisphere,
          easting,
          northing: minNorthing + (maxNorthing - minNorthing) * 0.05,
        });
        features.push({
          type: "Feature",
          properties: {
            type: "label",
            label: String(Math.floor(easting / 1000)),
            direction: "vertical",
          },
          geometry: {
            type: "Point",
            coordinates: [labelLatLng.longitude, labelLatLng.latitude],
          },
        });
      }
    }
  }

  // Generate horizontal lines (constant northing)
  for (
    let northing = minNorthing;
    northing <= maxNorthing;
    northing += northingStep
  ) {
    const coordinates: [number, number][] = [];

    // Generate points along the line
    for (let easting = minEasting; easting <= maxEasting; easting += 500) {
      const latLng = utmToLatLng({
        zone,
        hemisphere,
        easting,
        northing,
      });
      coordinates.push([latLng.longitude, latLng.latitude]);
    }

    if (coordinates.length >= 2) {
      features.push({
        type: "Feature",
        properties: { type: "line", direction: "horizontal", value: northing },
        geometry: { type: "LineString", coordinates },
      });

      // Add label at the left of the line
      if (includeLabels) {
        const labelLatLng = utmToLatLng({
          zone,
          hemisphere,
          easting: minEasting + (maxEasting - minEasting) * 0.02,
          northing,
        });
        features.push({
          type: "Feature",
          properties: {
            type: "label",
            label: String(Math.floor(northing / 1000)),
            direction: "horizontal",
          },
          geometry: {
            type: "Point",
            coordinates: [labelLatLng.longitude, labelLatLng.latitude],
          },
        });
      }
    }
  }

  return features;
}
