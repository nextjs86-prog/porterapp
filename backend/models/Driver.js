const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    phone:       { type: String, required: true, unique: true },
    email:       { type: String, lowercase: true },
    photo:       { type: String },
    vehicleType: { type: String, enum: ['bike', 'mini_truck', 'tempo', 'large_truck'], required: true },
    vehicleNumber: { type: String, required: true },
    documents: {
      drivingLicense: { url: String, verified: { type: Boolean, default: false } },
      rc:             { url: String, verified: { type: Boolean, default: false } },
      aadhar:         { url: String, verified: { type: Boolean, default: false } },
    },
    isOnline:    { type: Boolean, default: false },
    isApproved:  { type: Boolean, default: false },
    isBlocked:   { type: Boolean, default: false },
    currentLocation: {
      type:        { type: String, default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    rating:         { type: Number, default: 5 },
    totalRatings:   { type: Number, default: 0 },
    totalEarnings:  { type: Number, default: 0 },
    fcmToken:       { type: String },
  },
  { timestamps: true }
);

driverSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('Driver', driverSchema);
