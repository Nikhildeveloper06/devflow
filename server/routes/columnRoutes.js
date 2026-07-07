const express = require('express');
const router = express.Router();
const { create, getAll, update, remove } = require('../controllers/columnController');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

router.post('/', create);
router.get('/board/:boardId', getAll);
router.patch('/:id', update);
router.delete('/:id', remove);

module.exports = router;
