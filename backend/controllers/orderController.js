const Order      = require('../models/Order');
const Driver     = require('../models/Driver');
const Rating     = require('../models/Rating');
const PromoCode  = require('../models/PromoCode');
const { calculateFare } = require('../utils/fareCalculator');
const { sendPushNotification } = require('../utils/fcmService');
const { haversineKm, estimateEtaMinutes } = require('../utils/geo');

exports.fareEstimate = async (req, res) => {
  try {
    const { vehicleType, distanceKm } = req.body;
    const fare = await calculateFare(vehicleType, distanceKm);
    const durationMins = estimateEtaMinutes(distanceKm, vehicleType);
    res.json({ ...fare, durationMins });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getNearbyDrivers = async (req, res) => {
  try {
    const { lat, lng, vehicleType } = req.query;
    if (!lat || !lng || !vehicleType) {
      return res.status(400).json({ message: 'lat, lng and vehicleType are required' });
    }

    const drivers = await Driver.find({
      isOnline: true,
      isApproved: true,
      vehicleType,
      currentLocation: {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: 10000,
        },
      },
    }).select('name vehicleType vehicleNumber rating currentLocation').limit(20);

    const withEta = drivers.map((d) => {
      const [dLng, dLat] = d.currentLocation.coordinates;
      const distanceKm = haversineKm(Number(lat), Number(lng), dLat, dLng);
      return {
        _id: d._id,
        name: d.name,
        vehicleType: d.vehicleType,
        vehicleNumber: d.vehicleNumber,
        rating: d.rating,
        location: { latitude: dLat, longitude: dLng },
        distanceKm: Math.round(distanceKm * 10) / 10,
        etaMinutes: estimateEtaMinutes(distanceKm, d.vehicleType),
      };
    });

    res.json(withEta);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { pickup, drop, vehicleType, scheduledAt, promoDiscount, promoCode, paymentMethod, notes } = req.body;

    const distanceKm = haversineKm(pickup.lat, pickup.lng, drop.lat, drop.lng);
    const fareBreakdown = await calculateFare(vehicleType, distanceKm, promoDiscount || 0);

    const isFutureBooking = scheduledAt && new Date(scheduledAt) > new Date();

    const order = await Order.create({
      customer: req.user._id,
      pickup, drop, vehicleType, scheduledAt,
      distanceKm: Math.round(distanceKm * 10) / 10,
      durationMins: estimateEtaMinutes(distanceKm, vehicleType),
      fareBreakdown,
      paymentMethod,
      notes,
      promoCode: promoCode || undefined,
      status: isFutureBooking ? 'pending' : 'searching',
      otp: Math.floor(1000 + Math.random() * 9000).toString(),
    });

    if (promoCode) {
      await PromoCode.updateOne({ code: promoCode }, { $inc: { usedCount: 1 } });
    }

    // Scheduled orders are dispatched to drivers closer to the pickup time, not immediately
    if (isFutureBooking) {
      return res.status(201).json(order);
    }

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
        distanceKm: order.distanceKm,
        durationMins: order.durationMins,
        notes: order.notes,
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

    const isOwner = order.customer?._id?.equals(req.user._id) || order.driver?._id?.equals(req.user._id);
    if (!isOwner) return res.status(403).json({ message: 'Not authorized to view this order' });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, otp } = req.body;

    // Starting the delivery requires the customer's pickup OTP as proof goods were handed over
    if (status === 'in_transit') {
      const existing = await Order.findById(req.params.id).select('otp');
      if (!existing) return res.status(404).json({ message: 'Order not found' });
      if (!otp || otp !== existing.otp) {
        return res.status(400).json({ message: 'Incorrect pickup OTP' });
      }
    }

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

    let liveEtaMinutes = null;
    if (order.driver?.currentLocation?.coordinates) {
      const [dLng, dLat] = order.driver.currentLocation.coordinates;
      const target = ['pickup', 'in_transit'].includes(order.status) ? order.drop : order.pickup;
      const distanceKm = haversineKm(dLat, dLng, target.lat, target.lng);
      liveEtaMinutes = estimateEtaMinutes(distanceKm, order.vehicleType);
    }

    res.json({
      status:         order.status,
      driverLocation: order.driver?.currentLocation,
      driver:         order.driver,
      liveEtaMinutes,
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
