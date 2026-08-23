const AdminSettings = require('../models/AdminSettings');

const defaultPricing = {
  bike:        { baseFare: 40,  perKmRate: 10, minFare: 40  },
  mini_truck:  { baseFare: 100, perKmRate: 18, minFare: 100 },
  tempo:       { baseFare: 150, perKmRate: 22, minFare: 150 },
  large_truck: { baseFare: 250, perKmRate: 30, minFare: 250 },
};

const calculateFare = async (vehicleType, distanceKm, promoDiscount = 0) => {
  let pricing;
  try {
    const settings = await AdminSettings.findOne();
    pricing = settings?.pricing?.find(p => p.vehicleType === vehicleType) || defaultPricing[vehicleType];
  } catch {
    pricing = defaultPricing[vehicleType];
  }

  const baseFare     = pricing.baseFare;
  const distanceFare = distanceKm * pricing.perKmRate;
  const surgeFare    = 0;
  const subtotal     = Math.max(baseFare + distanceFare + surgeFare, pricing.minFare);
  const discount     = Math.min(promoDiscount, subtotal * 0.5);
  const total        = Math.round(subtotal - discount);

  return { baseFare, distanceFare, surgeFare, discount, total };
};

module.exports = { calculateFare };
