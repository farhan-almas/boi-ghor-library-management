const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getDashboard);
router.get('/wishlist', authenticate, ctrl.getWishlist);
router.post('/wishlist', authenticate, ctrl.addToWishlist);
router.delete('/wishlist/:id', authenticate, ctrl.removeFromWishlist);

module.exports = router;
