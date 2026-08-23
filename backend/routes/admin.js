const router = require('express').Router();
const { protectAdmin } = require('../middleware/auth');
const {
  getDashboardStats, getDrivers, approveDriver, blockDriver,
  getOrders, assignDriver, getCustomers, blockCustomer,
  updatePricing, getPricing, createPromo, getPromos, deletePromo,
  sendNotification, getAnalytics,
} = require('../controllers/adminController');

router.get('/dashboard-stats',       protectAdmin, getDashboardStats);
router.get('/drivers',               protectAdmin, getDrivers);
router.put('/driver/:id/approve',    protectAdmin, approveDriver);
router.put('/driver/:id/block',      protectAdmin, blockDriver);
router.get('/orders',                protectAdmin, getOrders);
router.put('/order/:id/assign',      protectAdmin, assignDriver);
router.get('/customers',             protectAdmin, getCustomers);
router.put('/customer/:id/block',    protectAdmin, blockCustomer);
router.post('/pricing',              protectAdmin, updatePricing);
router.get('/pricing',               protectAdmin, getPricing);
router.post('/promo',                protectAdmin, createPromo);
router.get('/promos',                protectAdmin, getPromos);
router.delete('/promo/:id',          protectAdmin, deletePromo);
router.post('/notification/send',    protectAdmin, sendNotification);
router.get('/analytics',             protectAdmin, getAnalytics);

module.exports = router;
