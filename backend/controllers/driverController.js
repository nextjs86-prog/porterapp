const Driver = require('../models/Driver');
const Order  = require('../models/Order');
const moment = require('moment');
const { haversineKm } = require('../utils/geo');

const NEARBY_RADIUS_KM = 5;

exports.register = async (req, res) => {
  try {
    const { name, phone, email, vehicleType, vehicleNumber } = req.body;
    const exists = await Driver.findOne({ phone });
    if (exists) return res.status(400).json({ message: 'Driver already registered' });

    const files = req.files || {};
    const driver = await Driver.create({
      name, phone, email, vehicleType, vehicleNumber,
      photo: files.photo?.[0]?.path,
      documents: {
        drivingLicense: { url: files.drivingLicense?.[0]?.path },
        rc:             { url: files.rc?.[0]?.path },
        aadhar:         { url: files.aadhar?.[0]?.path },
      },
    });
    res.status(201).json({ message: 'Registration submitted. Awaiting approval.', driver });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.user._id,
      { isOnline: !req.user.isOnline },
      { new: true }
    );

    // Catch the driver up on any orders that were placed while they were
    // offline and are still waiting for a driver, instead of leaving those
    // stuck forever (order:new is otherwise only broadcast once, at booking time).
    if (driver.isOnline && driver.currentLocation?.coordinates?.some(c => c !== 0)) {
      const [dLng, dLat] = driver.currentLocation.coordinates;
      const waitingOrders = await Order.find({
        status: 'searching',
        vehicleType: driver.vehicleType,
      }).limit(20);

      for (const order of waitingOrders) {
        const distanceKm = haversineKm(dLat, dLng, order.pickup.lat, order.pickup.lng);
        if (distanceKm <= NEARBY_RADIUS_KM) {
          req.io?.to(`driver:${driver._id}`).emit('order:new', {
            orderId: order._id,
            pickup: order.pickup, drop: order.drop,
            fareBreakdown: order.fareBreakdown, vehicleType: order.vehicleType,
            distanceKm: order.distanceKm, durationMins: order.durationMins,
            notes: order.notes,
          });
        }
      }
    }

    res.json({ isOnline: driver.isOnline });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    await Driver.findByIdAndUpdate(req.user._id, {
      currentLocation: { type: 'Point', coordinates: [lng, lat] },
    });
    req.io?.emit(`driver:location:${req.user._id}`, { lat, lng });
    res.json({ message: 'Location updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getEarnings = async (req, res) => {
  try {
    const { period = 'daily' } = req.query;
    const ranges = {
      daily:   [moment().startOf('day'),   moment().endOf('day')],
      weekly:  [moment().startOf('week'),  moment().endOf('week')],
      monthly: [moment().startOf('month'), moment().endOf('month')],
    };
    const [start, end] = ranges[period] || ranges.daily;

    const orders = await Order.find({
      driver: req.user._id,
      status: 'delivered',
      createdAt: { $gte: start.toDate(), $lte: end.toDate() },
    });

    const earnings = orders.reduce((sum, o) => sum + (o.fareBreakdown?.total || 0), 0);
    const commission = process.env.COMMISSION_PCT ? earnings * (Number(process.env.COMMISSION_PCT) / 100) : earnings * 0.2;

    res.json({ total: earnings, driverShare: earnings - commission, trips: orders.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTripHistory = async (req, res) => {
  try {
    const orders = await Order.find({ driver: req.user._id, status: 'delivered' })
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
