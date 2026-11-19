const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/billingController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getBilling);
router.post('/:id/pay', authenticate, ctrl.payFine);
router.post('/checkout', authenticate, ctrl.checkout);

module.exports = router;
