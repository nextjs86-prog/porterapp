const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema({
  vehicleType:  { type: String, required: true },
  baseFare:     { type: Number, required: true },
  perKmRate:    { type: Number, required: true },
  perMinRate:   { type: Number, default: 0 },
  minFare:      { type: Number, required: true },
});

const adminSettingsSchema = new mongoose.Schema(
  {
    pricing:        [pricingSchema],
    commissionPct:  { type: Number, default: 20 },
    surgeMultiplier: { type: Number, default: 1 },
    surgeEnabled:   { type: Boolean, default: false },
    appVersion:     { type: String, default: '1.0.0' },
    maintenanceMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminSettings', adminSettingsSchema);
