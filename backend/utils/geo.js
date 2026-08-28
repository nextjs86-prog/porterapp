const AVG_SPEED_KMH = {
  bike:        30,
  mini_truck:  25,
  tempo:       22,
  large_truck: 18,
};

const haversineKm = (lat1, lng1, lat2, lng2) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const estimateEtaMinutes = (distanceKm, vehicleType) => {
  const speed = AVG_SPEED_KMH[vehicleType] || 25;
  const travelMinutes = (distanceKm / speed) * 60;
  return Math.max(1, Math.round(travelMinutes + 3)); // +3 min buffer for loading/traffic
};

module.exports = { haversineKm, estimateEtaMinutes, AVG_SPEED_KMH };
