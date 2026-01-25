/**
 * UTM Helper Functions
 *
 * Utility functions for UTM coordinate formatting and calculations
 * used in the game components.
 */

/**
 * Formats the last 3 digits of a UTM coordinate (meters portion).
 * Example: 477456 -> "456"
 */
export function formatUtmMeters(coordinate: number): string {
  return String(Math.floor(coordinate) % 1000).padStart(3, "0");
}

/**
 * Calculates the base (km) value for a UTM coordinate.
 * Example: 477456 -> 477000
 */
export function getUtmBaseKm(coordinate: number): number {
  return Math.floor(coordinate / 1000) * 1000;
}

/**
 * Calculates full UTM coordinate from base and 3-digit meter input.
 * Example: baseEasting=477000, metersInput="456" -> 477456
 */
export function calculateFullUtm(baseKm: number, metersInput: string): number {
  return getUtmBaseKm(baseKm) + Number.parseInt(metersInput, 10);
}

/**
 * Default UTM base values for Darmstadt area.
 * Used as fallback when location data is not available.
 */
export const DARMSTADT_DEFAULTS = {
  baseEasting: 477000,
  baseNorthing: 5523000,
  utmZone: "32U",
} as const;

/**
 * Extracts safe UTM location data with defaults.
 * Returns consistent UTM values even if location data is partial.
 */
export function extractLocationUtm(
  location:
    | {
        utmZone?: string;
        utmEasting?: number;
        utmNorthing?: number;
      }
    | null
    | undefined,
): {
  utmZone: string;
  utmEasting: number;
  utmNorthing: number;
} {
  return {
    utmZone: location?.utmZone ?? DARMSTADT_DEFAULTS.utmZone,
    utmEasting: location?.utmEasting ?? DARMSTADT_DEFAULTS.baseEasting,
    utmNorthing: location?.utmNorthing ?? DARMSTADT_DEFAULTS.baseNorthing,
  };
}

/**
 * Validates that UTM input is complete (exactly 3 digits).
 */
export function isUtmInputComplete(
  eastingInput: string,
  northingInput: string,
): boolean {
  return eastingInput.length === 3 && northingInput.length === 3;
}

/**
 * Parses a UTM zone string into zone number and hemisphere.
 * Example: "32U" -> { zone: 32, hemisphere: "N" }
 */
export function parseUtmZone(utmZone: string): {
  zone: number;
  hemisphere: "N" | "S";
} {
  const zone = Number.parseInt(utmZone.slice(0, -1), 10);
  const hemisphere = utmZone.slice(-1).toUpperCase() >= "N" ? "N" : "S";
  return { zone, hemisphere: hemisphere as "N" | "S" };
}
