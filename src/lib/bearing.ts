/**
 * Bearing and Direction Utilities
 *
 * Functions for calculating destinations from bearing/distance
 * and formatting compass directions in German.
 */

/**
 * Calculate destination point given start point, bearing, and distance.
 * Uses the Haversine formula for spherical Earth calculations.
 *
 * @param lat - Starting latitude in degrees
 * @param lng - Starting longitude in degrees
 * @param bearingDegrees - Bearing in degrees (0-360, clockwise from north)
 * @param distanceMeters - Distance in meters
 * @returns Destination coordinates
 */
export function calculateDestination(
  lat: number,
  lng: number,
  bearingDegrees: number,
  distanceMeters: number,
): { lat: number; lng: number } {
  const R = 6371000; // Earth's radius in meters

  // Convert to radians
  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;
  const bearing = (bearingDegrees * Math.PI) / 180;
  const angularDistance = distanceMeters / R;

  // Calculate destination
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing),
  );

  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2),
    );

  // Convert back to degrees
  return {
    lat: (lat2 * 180) / Math.PI,
    lng: (lng2 * 180) / Math.PI,
  };
}

/**
 * German compass direction entry for 8-point compass.
 */
export interface CompassDirection {
  label: string;
  full: string;
}

/**
 * German compass directions (8-point compass) for display.
 * Ordered clockwise starting from North.
 */
export const COMPASS_DIRECTIONS: readonly CompassDirection[] = [
  { label: "N", full: "Nord" },
  { label: "NO", full: "Nordost" },
  { label: "O", full: "Ost" },
  { label: "SO", full: "Suedost" },
  { label: "S", full: "Sued" },
  { label: "SW", full: "Suedwest" },
  { label: "W", full: "West" },
  { label: "NW", full: "Nordwest" },
] as const;

/**
 * Get the compass direction index for a bearing.
 * Each direction covers 45 degrees (360 / 8).
 *
 * @param degrees - Bearing in degrees (0-360)
 * @returns Index into COMPASS_DIRECTIONS (0-7)
 */
function getCompassIndex(degrees: number): number {
  // Normalize to 0-360, then shift by 22.5 so that N is centered at 0
  const normalized = ((degrees % 360) + 360) % 360;
  // Add 22.5 to center each direction in its 45-degree arc
  const shifted = (normalized + 22.5) % 360;
  return Math.floor(shifted / 45);
}

/**
 * Format bearing as German compass direction.
 *
 * @param degrees - Bearing in degrees (0-360)
 * @returns German compass abbreviation (N, NO, O, SO, S, SW, W, NW)
 */
export function formatBearing(degrees: number): string {
  return COMPASS_DIRECTIONS[getCompassIndex(degrees)].label;
}

/**
 * Format bearing as full German compass direction name.
 *
 * @param degrees - Bearing in degrees (0-360)
 * @returns Full German direction name
 */
export function formatBearingFull(degrees: number): string {
  return COMPASS_DIRECTIONS[getCompassIndex(degrees)].full;
}

/**
 * Format distance in meters with appropriate unit.
 *
 * @param meters - Distance in meters
 * @returns Formatted string (e.g., "450m" or "1.2km")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Validate bearing is within valid range.
 *
 * @param degrees - Bearing value to validate
 * @returns True if valid (0-360)
 */
export function isValidBearing(degrees: number): boolean {
  return degrees >= 0 && degrees <= 360;
}

/**
 * Validate distance is within reasonable range.
 *
 * @param meters - Distance value to validate
 * @returns True if valid (> 0 and < 100km)
 */
export function isValidDistance(meters: number): boolean {
  return meters > 0 && meters < 100000;
}
