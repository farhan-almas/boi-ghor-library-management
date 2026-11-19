const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/booksController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/explore', authenticate, ctrl.getExplore);
router.get('/random', ctrl.getRandomBook);
router.get('/years', ctrl.getYearDistribution);
router.get('/', ctrl.getAllBooks);
router.get('/:id', authenticate, ctrl.getBookById);
router.post('/', authenticate, requireAdmin, ctrl.createBook);
router.put('/:id', authenticate, requireAdmin, ctrl.updateBook);
router.delete('/:id', authenticate, requireAdmin, ctrl.deleteBook);

module.exports = router;
