const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient:     { type: mongoose.Schema.Types.ObjectId, refPath: 'recipientModel' },
    recipientModel: { type: String, enum: ['User', 'Driver'] },
    title:   { type: String, required: true },
    body:    { type: String, required: true },
    data:    { type: Object },
    isRead:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
