const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reservationsController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/reminders', authenticate, ctrl.getReminders);
router.get('/admin/queues', authenticate, requireAdmin, ctrl.getAdminQueues);
router.get('/book/:bookId', authenticate, ctrl.getMyReservation);
router.post('/', authenticate, ctrl.createReservation);
router.delete('/:id', authenticate, ctrl.cancelReservation);

module.exports = router;
