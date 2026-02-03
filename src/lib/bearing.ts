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
 * German compass directions (8-point compass)
 */
const COMPASS_DIRECTIONS = [
  { min: 337.5, max: 360, label: "N", full: "Nord" },
  { min: 0, max: 22.5, label: "N", full: "Nord" },
  { min: 22.5, max: 67.5, label: "NO", full: "Nordost" },
  { min: 67.5, max: 112.5, label: "O", full: "Ost" },
  { min: 112.5, max: 157.5, label: "SO", full: "Suedost" },
  { min: 157.5, max: 202.5, label: "S", full: "Sued" },
  { min: 202.5, max: 247.5, label: "SW", full: "Suedwest" },
  { min: 247.5, max: 292.5, label: "W", full: "West" },
  { min: 292.5, max: 337.5, label: "NW", full: "Nordwest" },
] as const;

/**
 * Format bearing as German compass direction.
 *
 * @param degrees - Bearing in degrees (0-360)
 * @returns German compass abbreviation (N, NO, O, SO, S, SW, W, NW)
 */
export function formatBearing(degrees: number): string {
  // Normalize to 0-360
  const normalized = ((degrees % 360) + 360) % 360;

  for (const dir of COMPASS_DIRECTIONS) {
    if (normalized >= dir.min && normalized < dir.max) {
      return dir.label;
    }
  }

  // Fallback (should not happen with valid input)
  return "N";
}

/**
 * Format bearing as full German compass direction name.
 *
 * @param degrees - Bearing in degrees (0-360)
 * @returns Full German direction name
 */
export function formatBearingFull(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360;

  for (const dir of COMPASS_DIRECTIONS) {
    if (normalized >= dir.min && normalized < dir.max) {
      return dir.full;
    }
  }

  return "Nord";
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
