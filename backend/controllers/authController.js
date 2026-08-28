const User         = require('../models/User');
const Driver       = require('../models/Driver');
const generateToken = require('../utils/generateToken');
const { generateOTP, sendOTP, storeOTP, verifyOTP } = require('../utils/otpService');

// Generate a unique referral code
const makeReferral = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// POST /api/auth/send-otp
exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone required' });
    const otp = generateOTP();
    storeOTP(phone, otp);
    await sendOTP(phone, otp);
    // Return otp in the response for testing until real MSG91 credentials are configured
    const devOtp = (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) ? undefined : otp;
    res.json({ message: 'OTP sent', ...(devOtp && { otp: devOtp }) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!verifyOTP(phone, otp)) return res.status(400).json({ message: 'Invalid or expired OTP' });

    let user = await User.findOne({ phone });
    let isNew = false;
    if (!user) {
      user = await User.create({ phone, referralCode: makeReferral() });
      isNew = true;
    }
    const token = generateToken(user._id, 'customer');
    res.json({ token, user, isNew });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/driver/verify-otp
exports.driverLogin = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!verifyOTP(phone, otp)) return res.status(400).json({ message: 'Invalid or expired OTP' });

    const driver = await Driver.findOne({ phone });
    if (!driver) return res.status(404).json({ message: 'Driver not registered' });
    if (!driver.isApproved) return res.status(403).json({ message: 'Account pending approval' });

    const token = generateToken(driver._id, 'driver');
    res.json({ token, driver });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/admin/login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = generateToken('admin', 'admin');
    res.json({ token, role: 'admin' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.logout = (_req, res) => res.json({ message: 'Logged out' });
