const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  address: String,
  lat:     Number,
  lng:     Number,
});

const orderSchema = new mongoose.Schema(
  {
    customer:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
    driver:     { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    pickup:     { type: locationSchema, required: true },
    drop:       { type: locationSchema, required: true },
    vehicleType: { type: String, enum: ['bike', 'mini_truck', 'tempo', 'large_truck'], required: true },
    status: {
      type: String,
      enum: ['pending', 'searching', 'accepted', 'pickup', 'in_transit', 'delivered', 'cancelled'],
      default: 'pending',
    },
    scheduledAt:   { type: Date },
    distanceKm:    { type: Number },
    durationMins:  { type: Number },
    fareBreakdown: {
      baseFare:      Number,
      distanceFare:  Number,
      surgeFare:     Number,
      discount:      Number,
      total:         Number,
    },
    paymentMethod: { type: String, enum: ['upi', 'card', 'netbanking', 'cod'], default: 'cod' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    promoCode:     { type: String },
    notes:         { type: String },
    cancelReason:  { type: String },
    otp:           { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
