const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { createRazorpayOrder, verifyPayment, confirmCOD } = require('../controllers/paymentController');

const auth = protect('customer');

router.post('/create-order', auth, createRazorpayOrder);
router.post('/verify',       auth, verifyPayment);
router.post('/cod-confirm',  auth, confirmCOD);

module.exports = router;
