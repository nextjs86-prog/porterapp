const User         = require('../models/User');
const Driver       = require('../models/Driver');
const Order        = require('../models/Order');
const PromoCode    = require('../models/PromoCode');
const AdminSettings = require('../models/AdminSettings');
const { sendToMultiple } = require('../utils/fcmService');
const moment = require('moment');

exports.getDashboardStats = async (_req, res) => {
  try {
    const today = { $gte: moment().startOf('day').toDate(), $lte: moment().endOf('day').toDate() };
    const [totalOrders, todayOrders, activeDrivers, totalCustomers, revenueAgg] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: today }),
      Driver.countDocuments({ isOnline: true }),
      User.countDocuments(),
      Order.aggregate([
        { $match: { status: 'delivered', createdAt: today } },
        { $group: { _id: null, total: { $sum: '$fareBreakdown.total' } } },
      ]),
    ]);

    res.json({
      totalOrders, todayOrders, activeDrivers, totalCustomers,
      revenueToday: revenueAgg[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDrivers = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status === 'pending')  filter.isApproved = false;
    if (status === 'approved') filter.isApproved = true;
    if (status === 'blocked')  filter.isBlocked  = true;
    const drivers = await Driver.find(filter).sort({ createdAt: -1 });
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.approveDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    res.json({ message: 'Driver approved', driver });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.blockDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    driver.isBlocked = !driver.isBlocked;
    await driver.save();
    res.json({ message: `Driver ${driver.isBlocked ? 'blocked' : 'unblocked'}`, driver });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const orders = await Order.find(filter)
      .populate('customer', 'name phone')
      .populate('driver',   'name phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Order.countDocuments(filter);
    res.json({ orders, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.assignDriver = async (req, res) => {
  try {
    const { driverId } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id, { driver: driverId, status: 'accepted' }, { new: true }
    );
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCustomers = async (_req, res) => {
  try {
    const customers = await User.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.blockCustomer = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Customer not found' });
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ message: `Customer ${user.isBlocked ? 'blocked' : 'unblocked'}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updatePricing = async (req, res) => {
  try {
    const { pricing, commissionPct } = req.body;
    let settings = await AdminSettings.findOne();
    if (!settings) settings = new AdminSettings();
    if (pricing) settings.pricing = pricing;
    if (commissionPct !== undefined) settings.commissionPct = commissionPct;
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPricing = async (_req, res) => {
  try {
    const settings = await AdminSettings.findOne();
    res.json(settings || {});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createPromo = async (req, res) => {
  try {
    const promo = await PromoCode.create(req.body);
    res.status(201).json(promo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPromos = async (_req, res) => {
  try {
    res.json(await PromoCode.find().sort({ createdAt: -1 }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deletePromo = async (req, res) => {
  try {
    await PromoCode.findByIdAndDelete(req.params.id);
    res.json({ message: 'Promo deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendNotification = async (req, res) => {
  try {
    const { title, body, audience } = req.body;
    let tokens = [];
    if (audience === 'all' || audience === 'customers') {
      const users = await User.find({ fcmToken: { $exists: true, $ne: null } });
      tokens.push(...users.map(u => u.fcmToken));
    }
    if (audience === 'all' || audience === 'drivers') {
      const drivers = await Driver.find({ fcmToken: { $exists: true, $ne: null } });
      tokens.push(...drivers.map(d => d.fcmToken));
    }
    await sendToMultiple(tokens, title, body);
    res.json({ message: `Notification sent to ${tokens.length} devices` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const { start, end } = req.query;
    const dateFilter = {};
    if (start) dateFilter.$gte = new Date(start);
    if (end)   dateFilter.$lte = new Date(end);

    const match = Object.keys(dateFilter).length ? { createdAt: dateFilter, status: 'delivered' } : { status: 'delivered' };

    const revenueByDay = await Order.aggregate([
      { $match: match },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$fareBreakdown.total' },
          count:   { $sum: 1 },
        }
      },
      { $sort: { _id: 1 } },
    ]);

    const topDrivers = await Order.aggregate([
      { $match: match },
      { $group: { _id: '$driver', trips: { $sum: 1 }, earnings: { $sum: '$fareBreakdown.total' } } },
      { $sort: { trips: -1 } }, { $limit: 10 },
      { $lookup: { from: 'drivers', localField: '_id', foreignField: '_id', as: 'driver' } },
      { $unwind: '$driver' },
    ]);

    res.json({ revenueByDay, topDrivers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
