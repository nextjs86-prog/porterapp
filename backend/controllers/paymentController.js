const Razorpay = require('razorpay');
const crypto   = require('crypto');
const Payment  = require('../models/Payment');
const Order    = require('../models/Order');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findOne({ _id: orderId, customer: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const rzpOrder = await razorpay.orders.create({
      amount:   order.fareBreakdown.total * 100,
      currency: 'INR',
      receipt:  `receipt_${orderId}`,
    });

    await Payment.create({
      order:          orderId,
      customer:       req.user._id,
      razorpayOrderId: rzpOrder.id,
      amount:         order.fareBreakdown.total,
    });

    res.json({ razorpayOrderId: rzpOrder.id, amount: rzpOrder.amount, currency: rzpOrder.currency,
               key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

    const order = await Order.findOne({ _id: orderId, customer: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const payment = await Payment.findOne({ razorpayOrderId, customer: req.user._id });
    if (!payment) return res.status(404).json({ message: 'Payment record not found' });

    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpaySignature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = 'paid';
    await payment.save();

    order.paymentStatus = 'paid';
    await order.save();

    res.json({ message: 'Payment verified' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.confirmCOD = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findOneAndUpdate(
      { _id: orderId, customer: req.user._id },
      { paymentStatus: 'paid', paymentMethod: 'cod' },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'COD confirmed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
