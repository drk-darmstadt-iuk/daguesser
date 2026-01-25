/**
 * UTM Coordinate Conversion Utilities
 *
 * Converts between WGS84 Lat/Lng and UTM coordinates.
 * Darmstadt is in UTM Zone 32U (32N for calculations).
 */

// WGS84 ellipsoid parameters
const WGS84 = {
  a: 6378137, // Semi-major axis (equatorial radius) in meters
  f: 1 / 298.257223563, // Flattening
  get b() {
    return this.a * (1 - this.f);
  }, // Semi-minor axis
  get e() {
    return Math.sqrt(2 * this.f - this.f * this.f);
  }, // First eccentricity
  get e2() {
    return this.e * this.e;
  }, // First eccentricity squared
  get ep2() {
    return this.e2 / (1 - this.e2);
  }, // Second eccentricity squared
};

// UTM parameters
const UTM = {
  k0: 0.9996, // Scale factor at central meridian
  falseEasting: 500000, // False easting in meters
  falseNorthingSouth: 10000000, // False northing for southern hemisphere
};

export interface UtmCoordinate {
  zone: number;
  hemisphere: "N" | "S";
  easting: number;
  northing: number;
  zoneLetter?: string; // e.g., "U" for 32U
}

export interface LatLngCoordinate {
  latitude: number;
  longitude: number;
}

/**
 * Get UTM zone number from longitude
 */
export function getUtmZone(longitude: number): number {
  return Math.floor((longitude + 180) / 6) + 1;
}

/**
 * Get UTM zone letter from latitude
 */
export function getUtmZoneLetter(latitude: number): string {
  const letters = "CDEFGHJKLMNPQRSTUVWX";
  if (latitude < -80) return "A";
  if (latitude > 84) return "Z";
  return letters[Math.floor((latitude + 80) / 8)];
}

/**
 * Get central meridian for a UTM zone
 */
function getCentralMeridian(zone: number): number {
  return (zone - 1) * 6 - 180 + 3;
}

/**
 * Convert latitude/longitude to UTM coordinates
 */
export function latLngToUtm(lat: number, lng: number): UtmCoordinate {
  const zone = getUtmZone(lng);
  const zoneLetter = getUtmZoneLetter(lat);
  const hemisphere = lat >= 0 ? "N" : "S";

  const lonRad = (lng * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;

  const centralMeridian = getCentralMeridian(zone);
  const centralMeridianRad = (centralMeridian * Math.PI) / 180;

  const N = WGS84.a / Math.sqrt(1 - WGS84.e2 * Math.sin(latRad) ** 2);
  const T = Math.tan(latRad) ** 2;
  const C = WGS84.ep2 * Math.cos(latRad) ** 2;
  const A = Math.cos(latRad) * (lonRad - centralMeridianRad);

  // Meridian arc length
  const M =
    WGS84.a *
    ((1 - WGS84.e2 / 4 - (3 * WGS84.e2 ** 2) / 64 - (5 * WGS84.e2 ** 3) / 256) *
      latRad -
      ((3 * WGS84.e2) / 8 +
        (3 * WGS84.e2 ** 2) / 32 +
        (45 * WGS84.e2 ** 3) / 1024) *
        Math.sin(2 * latRad) +
      ((15 * WGS84.e2 ** 2) / 256 + (45 * WGS84.e2 ** 3) / 1024) *
        Math.sin(4 * latRad) -
      ((35 * WGS84.e2 ** 3) / 3072) * Math.sin(6 * latRad));

  const easting =
    UTM.k0 *
      N *
      (A +
        ((1 - T + C) * A ** 3) / 6 +
        ((5 - 18 * T + T ** 2 + 72 * C - 58 * WGS84.ep2) * A ** 5) / 120) +
    UTM.falseEasting;

  let northing =
    UTM.k0 *
    (M +
      N *
        Math.tan(latRad) *
        (A ** 2 / 2 +
          ((5 - T + 9 * C + 4 * C ** 2) * A ** 4) / 24 +
          ((61 - 58 * T + T ** 2 + 600 * C - 330 * WGS84.ep2) * A ** 6) / 720));

  if (hemisphere === "S") {
    northing += UTM.falseNorthingSouth;
  }

  return {
    zone,
    hemisphere,
    easting: Math.round(easting * 100) / 100, // Round to cm precision
    northing: Math.round(northing * 100) / 100,
    zoneLetter,
  };
}

/**
 * Convert UTM coordinates to latitude/longitude
 */
export function utmToLatLng(utm: UtmCoordinate): LatLngCoordinate {
  const { zone, hemisphere, easting, northing } = utm;

  const x = easting - UTM.falseEasting;
  let y = northing;

  if (hemisphere === "S") {
    y -= UTM.falseNorthingSouth;
  }

  const centralMeridian = getCentralMeridian(zone);

  // Footprint latitude
  const M = y / UTM.k0;
  const mu =
    M /
    (WGS84.a *
      (1 - WGS84.e2 / 4 - (3 * WGS84.e2 ** 2) / 64 - (5 * WGS84.e2 ** 3) / 256));

  const e1 =
    (1 - Math.sqrt(1 - WGS84.e2)) / (1 + Math.sqrt(1 - WGS84.e2));

  const phi1 =
    mu +
    ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
    ((21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
    ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) +
    ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);

  const N1 = WGS84.a / Math.sqrt(1 - WGS84.e2 * Math.sin(phi1) ** 2);
  const T1 = Math.tan(phi1) ** 2;
  const C1 = WGS84.ep2 * Math.cos(phi1) ** 2;
  const R1 =
    (WGS84.a * (1 - WGS84.e2)) /
    Math.pow(1 - WGS84.e2 * Math.sin(phi1) ** 2, 1.5);
  const D = x / (N1 * UTM.k0);

  const lat =
    phi1 -
    ((N1 * Math.tan(phi1)) / R1) *
      (D ** 2 / 2 -
        ((5 + 3 * T1 + 10 * C1 - 4 * C1 ** 2 - 9 * WGS84.ep2) * D ** 4) / 24 +
        ((61 + 90 * T1 + 298 * C1 + 45 * T1 ** 2 - 252 * WGS84.ep2 - 3 * C1 ** 2) *
          D ** 6) /
          720);

  const lng =
    ((D -
      ((1 + 2 * T1 + C1) * D ** 3) / 6 +
      ((5 - 2 * C1 + 28 * T1 - 3 * C1 ** 2 + 8 * WGS84.ep2 + 24 * T1 ** 2) *
        D ** 5) /
        120) /
      Math.cos(phi1)) *
      (180 / Math.PI) +
    centralMeridian;

  return {
    latitude: Math.round((lat * 180) / Math.PI * 1e8) / 1e8,
    longitude: Math.round(lng * 1e8) / 1e8,
  };
}

/**
 * Calculate distance between two lat/lng points using Haversine formula
 * Returns distance in meters
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // Earth's radius in meters

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate distance between two UTM coordinates
 * Returns distance in meters
 */
export function utmDistance(utm1: UtmCoordinate, utm2: UtmCoordinate): number {
  // If same zone, use simple Euclidean distance (more accurate for UTM)
  if (utm1.zone === utm2.zone && utm1.hemisphere === utm2.hemisphere) {
    const dE = utm2.easting - utm1.easting;
    const dN = utm2.northing - utm1.northing;
    return Math.sqrt(dE * dE + dN * dN);
  }

  // Different zones - convert to lat/lng and use Haversine
  const ll1 = utmToLatLng(utm1);
  const ll2 = utmToLatLng(utm2);
  return haversineDistance(ll1.latitude, ll1.longitude, ll2.latitude, ll2.longitude);
}

/**
 * Format UTM coordinates for display
 * Returns format like "32U 477 456 / 55 234"
 */
export function formatUtm(utm: UtmCoordinate): string {
  const zoneStr = `${utm.zone}${utm.zoneLetter || utm.hemisphere}`;
  const eastingKm = Math.floor(utm.easting / 1000);
  const eastingM = Math.floor(utm.easting % 1000);
  const northingKm = Math.floor(utm.northing / 1000);
  const northingM = Math.floor(utm.northing % 1000);

  return `${zoneStr} ${eastingKm} ${String(eastingM).padStart(3, "0")} / ${northingKm} ${String(northingM).padStart(3, "0")}`;
}

/**
 * Format UTM for the game display (last 3 digits only)
 * Returns format like "477 456" for easting or "234" for the meters part
 */
export function formatUtmShort(
  easting: number,
  northing: number,
): { easting3: string; northing3: string } {
  return {
    easting3: String(Math.floor(easting) % 1000).padStart(3, "0"),
    northing3: String(Math.floor(northing) % 1000).padStart(3, "0"),
  };
}

/**
 * Parse UTM string input (3 digits for Easting, 3 for Northing)
 * baseEasting/baseNorthing are the km values (e.g., 477000, 5523000)
 */
export function parseUtmInput(
  eastingInput: string,
  northingInput: string,
  baseEasting: number,
  baseNorthing: number,
): { easting: number; northing: number } | null {
  const e = Number.parseInt(eastingInput, 10);
  const n = Number.parseInt(northingInput, 10);

  if (Number.isNaN(e) || Number.isNaN(n)) {
    return null;
  }

  if (e < 0 || e > 999 || n < 0 || n > 999) {
    return null;
  }

  return {
    easting: Math.floor(baseEasting / 1000) * 1000 + e,
    northing: Math.floor(baseNorthing / 1000) * 1000 + n,
  };
}

// Darmstadt is in UTM Zone 32U
// Approximate center: 49.8728, 8.6512
// UTM: 32U 477xxx 552xxxx
export const DARMSTADT_UTM_ZONE = 32;
export const DARMSTADT_UTM_LETTER = "U";
export const DARMSTADT_CENTER = {
  latitude: 49.8728,
  longitude: 8.6512,
};
