/**
 * Bearing and Direction Utilities (Backend)
 *
 * Copy of bearing functions for Convex backend.
 * Convex cannot import from outside its folder.
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
