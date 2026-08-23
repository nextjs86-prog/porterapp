const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    order:    { type: mongoose.Schema.Types.ObjectId, ref: 'Order',  required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
    driver:   { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
    stars:    { type: Number, min: 1, max: 5, required: true },
    review:   { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Rating', ratingSchema);
