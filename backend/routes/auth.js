const router = require('express').Router();
const {
  sendOtp, verifyOtp, driverLogin, adminLogin, logout,
} = require('../controllers/authController');

router.post('/send-otp',    sendOtp);
router.post('/verify-otp',  verifyOtp);
router.post('/driver/send-otp',   sendOtp);
router.post('/driver/verify-otp', driverLogin);
router.post('/admin/login', adminLogin);
router.post('/logout',      logout);

module.exports = router;
