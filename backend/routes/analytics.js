const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/analyticsController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getUserAnalytics);
router.get('/admin', authenticate, requireAdmin, ctrl.getAdminAnalytics);

module.exports = router;
