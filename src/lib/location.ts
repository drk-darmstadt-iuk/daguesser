/**
 * Location Utility Functions
 *
 * Shared utilities for handling location data in game components.
 */

import { utmToLatLng } from "./utm";
import { parseUtmZone } from "./utm-helpers";

/**
 * UTM coordinates required for position conversion.
 */
interface UtmPosition {
  utmZone: string;
  utmEasting: number;
  utmNorthing: number;
}

/**
 * Geographic position with latitude and longitude.
 */
export interface LatLngPosition {
  lat: number;
  lng: number;
}

/**
 * Get correct position from location data, converting from UTM if needed.
 *
 * If the location has latitude/longitude, returns those directly.
 * Otherwise, converts from UTM coordinates.
 *
 * @param location - Location object with optional lat/lng
 * @param utm - UTM coordinates for conversion fallback
 * @returns Position with lat/lng
 */
export function getCorrectPosition(
  location: { latitude?: number; longitude?: number } | undefined,
  utm: UtmPosition,
): LatLngPosition {
  if (location?.latitude != null && location?.longitude != null) {
    return { lat: location.latitude, lng: location.longitude };
  }

  const { zone, hemisphere } = parseUtmZone(utm.utmZone);
  const latLng = utmToLatLng({
    zone,
    hemisphere,
    easting: utm.utmEasting,
    northing: utm.utmNorthing,
  });
  return { lat: latLng.latitude, lng: latLng.longitude };
}
