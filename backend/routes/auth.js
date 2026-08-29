const router = require('express').Router();
const { body } = require('express-validator');
const {
  sendOtp, verifyOtp, driverLogin, adminLogin, logout,
} = require('../controllers/authController');
const { otpLimiter, loginLimiter } = require('../middleware/rateLimit');
const validate = require('../middleware/validate');

const phoneRule = body('phone').matches(/^[0-9]{10}$/).withMessage('Enter a valid 10-digit phone number');
const otpRule   = body('otp').matches(/^[0-9]{4,6}$/).withMessage('Enter a valid OTP');

router.post('/send-otp',    otpLimiter, phoneRule, validate, sendOtp);
router.post('/verify-otp',  loginLimiter, phoneRule, otpRule, validate, verifyOtp);
router.post('/driver/send-otp',   otpLimiter, phoneRule, validate, sendOtp);
router.post('/driver/verify-otp', loginLimiter, phoneRule, otpRule, validate, driverLogin);
router.post('/admin/login', loginLimiter, body('email').isEmail(), body('password').notEmpty(), validate, adminLogin);
router.post('/logout',      logout);

module.exports = router;
