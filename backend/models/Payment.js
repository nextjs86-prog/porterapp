const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order:          { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    customer:       { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
    razorpayOrderId:  { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    amount:         { type: Number, required: true },
    currency:       { type: String, default: 'INR' },
    method:         { type: String, enum: ['upi', 'card', 'netbanking', 'cod'] },
    status:         { type: String, enum: ['created', 'paid', 'failed', 'refunded'], default: 'created' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
