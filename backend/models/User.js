const mongoose = require('mongoose');

const savedAddressSchema = new mongoose.Schema({
  label: String,
  address: String,
  lat: Number,
  lng: Number,
});

const userSchema = new mongoose.Schema(
  {
    name:        { type: String, trim: true },
    phone:       { type: String, required: true, unique: true },
    email:       { type: String, lowercase: true },
    photo:       { type: String },
    savedAddresses: [savedAddressSchema],
    referralCode:   { type: String, unique: true },
    referredBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    walletBalance:  { type: Number, default: 0 },
    isBlocked:      { type: Boolean, default: false },
    fcmToken:       { type: String },
    language:       { type: String, default: 'en' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
