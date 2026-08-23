const axios = require('axios');

// In-memory OTP store (use Redis in production)
const otpStore = new Map();

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOTP = async (phone, otp) => {
  // MSG91 integration
  if (process.env.NODE_ENV === 'production') {
    await axios.post('https://api.msg91.com/api/v5/otp', {
      template_id: process.env.MSG91_TEMPLATE_ID,
      mobile:      `91${phone}`,
      otp,
    }, {
      headers: { authkey: process.env.MSG91_AUTH_KEY, 'Content-Type': 'application/json' },
    });
  }
  return otp;
};

const storeOTP = (phone, otp) => {
  otpStore.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
};

const verifyOTP = (phone, otp) => {
  const record = otpStore.get(phone);
  if (!record) return false;
  if (Date.now() > record.expiresAt) { otpStore.delete(phone); return false; }
  if (record.otp !== otp) return false;
  otpStore.delete(phone);
  return true;
};

module.exports = { generateOTP, sendOTP, storeOTP, verifyOTP };
