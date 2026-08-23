const Order   = require('../models/Order');
const Driver  = require('../models/Driver');
const Rating  = require('../models/Rating');
const { calculateFare } = require('../utils/fareCalculator');
const { sendPushNotification } = require('../utils/fcmService');

exports.fareEstimate = async (req, res) => {
  try {
    const { vehicleType, distanceKm } = req.body;
    const fare = await calculateFare(vehicleType, distanceKm);
    res.json(fare);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { pickup, drop, vehicleType, scheduledAt, promoDiscount, paymentMethod, notes } = req.body;

    // Haversine distance estimate
    const toRad = d => d * Math.PI / 180;
    const R = 6371;
    const dLat = toRad(drop.lat - pickup.lat);
    const dLng = toRad(drop.lng - pickup.lng);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(pickup.lat))*Math.cos(toRad(drop.lat))*Math.sin(dLng/2)**2;
    const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const fareBreakdown = await calculateFare(vehicleType, distanceKm, promoDiscount || 0);

    const order = await Order.create({
      customer: req.user._id,
      pickup, drop, vehicleType, scheduledAt,
      distanceKm: Math.round(distanceKm * 10) / 10,
      fareBreakdown,
      paymentMethod,
      notes,
      status: 'searching',
      otp: Math.floor(1000 + Math.random() * 9000).toString(),
    });

    // Find nearby drivers
    const nearbyDrivers = await Driver.find({
      isOnline: true,
      isApproved: true,
      vehicleType,
      currentLocation: {
        $near: {
          $geometry: { type: 'Point', coordinates: [pickup.lng, pickup.lat] },
          $maxDistance: 10000,
        },
      },
    }).limit(5);

    // Notify nearby drivers
    for (const driver of nearbyDrivers) {
      if (driver.fcmToken) {
        await sendPushNotification(
          driver.fcmToken,
          'New Order Request',
          `Pickup: ${pickup.address}`,
          { orderId: order._id.toString(), type: 'new_order' }
        );
      }
      req.io?.to(`driver:${driver._id}`).emit('order:new', {
        orderId: order._id,
        pickup, drop, fareBreakdown, vehicleType,
      });
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('driver',   'name phone photo vehicleType vehicleNumber rating currentLocation')
      .populate('customer', 'name phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('customer', 'name fcmToken');

    if (order.customer?.fcmToken) {
      const messages = {
        pickup:      'Driver is at pickup location',
        in_transit:  'Your goods are on the way!',
        delivered:   'Order delivered successfully!',
      };
      if (messages[status]) {
        await sendPushNotification(order.customer.fcmToken, 'Order Update', messages[status]);
      }
    }

    req.io?.to(`customer:${order.customer._id}`).emit('order:update', { orderId: order._id, status });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTracking = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('driver', 'name phone photo vehicleType vehicleNumber rating currentLocation');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({
      status:         order.status,
      driverLocation: order.driver?.currentLocation,
      driver:         order.driver,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.acceptOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, status: 'searching' },
      { driver: req.user._id, status: 'accepted' },
      { new: true }
    ).populate('customer', 'name fcmToken');

    if (!order) return res.status(400).json({ message: 'Order not available' });

    if (order.customer?.fcmToken) {
      await sendPushNotification(
        order.customer.fcmToken, 'Driver Found!',
        `${req.user.name} is on the way`, { orderId: order._id.toString(), type: 'driver_assigned' }
      );
    }
    req.io?.to(`customer:${order.customer._id}`).emit('order:update', {
      orderId: order._id, status: 'accepted', driver: req.user,
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.rejectOrder = async (req, res) => {
  try {
    res.json({ message: 'Order rejected' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, customer: req.user._id },
      { status: 'cancelled', cancelReason: reason },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order cancelled', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.rateOrder = async (req, res) => {
  try {
    const { stars, review } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order || !order.driver) return res.status(400).json({ message: 'Invalid order' });

    await Rating.create({ order: order._id, customer: req.user._id, driver: order.driver, stars, review });

    // Update driver average rating
    const ratings = await Rating.find({ driver: order.driver });
    const avg = ratings.reduce((s, r) => s + r.stars, 0) / ratings.length;
    await Driver.findByIdAndUpdate(order.driver, { rating: Math.round(avg * 10) / 10, totalRatings: ratings.length });

    res.json({ message: 'Rating submitted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
