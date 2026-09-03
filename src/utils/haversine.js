/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula:
 * d = 2R * arcsin(sqrt(sin^2(dLat/2) + cos(lat1)*cos(lat2)*sin^2(dLon/2)))
 *
 * @param {number} lat1 Latitude of point 1 in degrees
 * @param {number} lon1 Longitude of point 1 in degrees
 * @param {number} lat2 Latitude of point 2 in degrees
 * @param {number} lon2 Longitude of point 2 in degrees
 * @returns {number} Distance in meters (rounded)
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const p1Lat = parseFloat(lat1);
  const p1Lon = parseFloat(lon1);
  const p2Lat = parseFloat(lat2);
  const p2Lon = parseFloat(lon2);

  if (isNaN(p1Lat) || isNaN(p1Lon) || isNaN(p2Lat) || isNaN(p2Lon)) {
    return 0;
  }

  const R = 6371000; // Earth's radius in meters
  const toRad = (degree) => (degree * Math.PI) / 180;

  const dLat = toRad(p2Lat - p1Lat);
  const dLon = toRad(p2Lon - p1Lon);

  const phi1 = toRad(p1Lat);
  const phi2 = toRad(p2Lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Checks if a distance is within the allowed geofence radius.
 *
 * @param {number} distanceMeters Distance in meters
 * @param {number} radiusMeters Allowed radius threshold in meters (default 50m)
 * @returns {boolean}
 */
export function isWithinGeofence(distanceMeters, radiusMeters = 50) {
  return distanceMeters <= radiusMeters;
}
