const router = require('express').Router();
const { protect } = require('../middleware/auth');
const {
  createOrder, getOrder, updateOrderStatus,
  getTracking, acceptOrder, rejectOrder,
  cancelOrder, rateOrder, fareEstimate,
  getNearbyDrivers,
} = require('../controllers/orderController');

const customerAuth = protect('customer');
const driverAuth   = protect('driver');

router.get('/nearby-drivers',     customerAuth, getNearbyDrivers);
router.post('/estimate',          customerAuth, fareEstimate);
router.post('/create',            customerAuth, createOrder);
router.get('/:id',                customerAuth, getOrder);
router.put('/:id/status',         driverAuth,   updateOrderStatus);
router.get('/:id/tracking',       customerAuth, getTracking);
router.post('/:id/accept',        driverAuth,   acceptOrder);
router.post('/:id/reject',        driverAuth,   rejectOrder);
router.delete('/:id',             customerAuth, cancelOrder);
router.post('/:id/rate',          customerAuth, rateOrder);

module.exports = router;
