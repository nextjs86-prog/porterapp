const router = require('express').Router();
const { body } = require('express-validator');
const { protect, protectAny } = require('../middleware/auth');
const {
  createOrder, getOrder, updateOrderStatus,
  getTracking, acceptOrder, rejectOrder,
  cancelOrder, driverCancelOrder, rateOrder, fareEstimate,
  getNearbyDrivers,
} = require('../controllers/orderController');
const validate = require('../middleware/validate');

const customerAuth = protect('customer');
const driverAuth   = protect('driver');

const VEHICLE_TYPES = ['bike', 'mini_truck', 'tempo', 'large_truck'];

const createOrderRules = [
  body('pickup.lat').isFloat({ min: -90, max: 90 }),
  body('pickup.lng').isFloat({ min: -180, max: 180 }),
  body('drop.lat').isFloat({ min: -90, max: 90 }),
  body('drop.lng').isFloat({ min: -180, max: 180 }),
  body('vehicleType').isIn(VEHICLE_TYPES).withMessage('Invalid vehicle type'),
];

router.get('/nearby-drivers',     customerAuth, getNearbyDrivers);
router.post('/estimate',          customerAuth, body('vehicleType').isIn(VEHICLE_TYPES), body('distanceKm').isFloat({ min: 0 }), validate, fareEstimate);
router.post('/create',            customerAuth, createOrderRules, validate, createOrder);
router.get('/:id',                protectAny,   getOrder);
router.put('/:id/status',         driverAuth,   updateOrderStatus);
router.get('/:id/tracking',       customerAuth, getTracking);
router.post('/:id/accept',        driverAuth,   acceptOrder);
router.post('/:id/reject',        driverAuth,   rejectOrder);
router.delete('/:id',             customerAuth, cancelOrder);
router.post('/:id/driver-cancel', driverAuth,   driverCancelOrder);
router.post('/:id/rate',          customerAuth, body('stars').isInt({ min: 1, max: 5 }), validate, rateOrder);

module.exports = router;
