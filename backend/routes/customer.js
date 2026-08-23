const router = require('express').Router();
const { protect } = require('../middleware/auth');
const {
  getProfile, updateProfile, getSavedAddresses, addSavedAddress,
  getOrderHistory, applyPromo,
} = require('../controllers/customerController');

const auth = protect('customer');

router.get('/profile',           auth, getProfile);
router.put('/profile',           auth, updateProfile);
router.get('/addresses',         auth, getSavedAddresses);
router.post('/addresses',        auth, addSavedAddress);
router.get('/orders',            auth, getOrderHistory);
router.post('/promo/apply',      auth, applyPromo);

module.exports = router;
