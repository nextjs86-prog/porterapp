const router  = require('express').Router();
const { body } = require('express-validator');
const upload  = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  register, toggleStatus, updateLocation,
  getEarnings, getTripHistory,
} = require('../controllers/driverController');

const auth = protect('driver');
const VEHICLE_TYPES = ['bike', 'mini_truck', 'tempo', 'large_truck'];

router.post('/register',
  upload.fields([
    { name: 'drivingLicense', maxCount: 1 },
    { name: 'rc',             maxCount: 1 },
    { name: 'aadhar',         maxCount: 1 },
    { name: 'photo',          maxCount: 1 },
  ]),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Enter a valid 10-digit phone number'),
  body('vehicleType').isIn(VEHICLE_TYPES).withMessage('Invalid vehicle type'),
  body('vehicleNumber').trim().notEmpty().withMessage('Vehicle number is required'),
  validate,
  register
);
router.put('/toggle-status', auth, toggleStatus);
router.put('/location',      auth, updateLocation);
router.get('/earnings',      auth, getEarnings);
router.get('/trips',         auth, getTripHistory);

module.exports = router;
