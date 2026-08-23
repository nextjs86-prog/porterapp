const User      = require('../models/User');
const Order     = require('../models/Order');
const PromoCode = require('../models/PromoCode');

exports.getProfile = (req, res) => res.json(req.user);

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, fcmToken } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id, { name, email, fcmToken }, { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSavedAddresses = (req, res) => res.json(req.user.savedAddresses);

exports.addSavedAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.savedAddresses.push(req.body);
    await user.save();
    res.json(user.savedAddresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOrderHistory = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('driver', 'name phone photo vehicleType vehicleNumber rating')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.applyPromo = async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    const promo = await PromoCode.findOne({ code: code.toUpperCase(), isActive: true });
    if (!promo) return res.status(404).json({ message: 'Invalid promo code' });
    if (promo.expiresAt && promo.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Promo code expired' });
    }
    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
      return res.status(400).json({ message: 'Promo code usage limit reached' });
    }
    if (orderTotal < promo.minOrderValue) {
      return res.status(400).json({ message: `Minimum order value ₹${promo.minOrderValue} required` });
    }

    let discount = promo.discountType === 'flat'
      ? promo.discountValue
      : (orderTotal * promo.discountValue) / 100;

    if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);

    res.json({ discount: Math.round(discount), promo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
