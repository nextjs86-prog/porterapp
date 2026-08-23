const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema(
  {
    code:          { type: String, required: true, unique: true, uppercase: true },
    discountType:  { type: String, enum: ['percent', 'flat'], required: true },
    discountValue: { type: Number, required: true },
    maxDiscount:   { type: Number },
    minOrderValue: { type: Number, default: 0 },
    usageLimit:    { type: Number },
    usedCount:     { type: Number, default: 0 },
    expiresAt:     { type: Date },
    isActive:      { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PromoCode', promoCodeSchema);
