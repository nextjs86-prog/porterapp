const jwt = require('jsonwebtoken');
const User   = require('../models/User');
const Driver = require('../models/Driver');

const protect = (model) => async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const Model = model === 'driver' ? Driver : User;
    req.user = await Model.findById(decoded.id).select('-__v');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    if (req.user.isBlocked) return res.status(403).json({ message: 'Account blocked' });
    next();
  } catch {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};

// For routes shared between customers and drivers (e.g. viewing an order
// both are party to) — picks the model based on the role embedded in the token.
const protectAny = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const Model = decoded.role === 'driver' ? Driver : User;
    req.user = await Model.findById(decoded.id).select('-__v');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    if (req.user.isBlocked) return res.status(403).json({ message: 'Account blocked' });
    req.userRole = decoded.role;
    next();
  } catch {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};

const protectAdmin = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};

module.exports = { protect, protectAny, protectAdmin };
