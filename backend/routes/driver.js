const router  = require('express').Router();
const upload  = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const {
  register, toggleStatus, updateLocation,
  getEarnings, getTripHistory,
} = require('../controllers/driverController');

const auth = protect('driver');

router.post('/register',
  upload.fields([
    { name: 'drivingLicense', maxCount: 1 },
    { name: 'rc',             maxCount: 1 },
    { name: 'aadhar',         maxCount: 1 },
    { name: 'photo',          maxCount: 1 },
  ]),
  register
);
router.put('/toggle-status', auth, toggleStatus);
router.put('/location',      auth, updateLocation);
router.get('/earnings',      auth, getEarnings);
router.get('/trips',         auth, getTripHistory);

module.exports = router;
