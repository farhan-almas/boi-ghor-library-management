const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/issuesController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getIssuedBooks);
router.post('/', authenticate, ctrl.issueBook);
router.put('/:id/return', authenticate, ctrl.returnBook);
router.post('/:id/rating', authenticate, ctrl.rateReturnedBook);

module.exports = router;
