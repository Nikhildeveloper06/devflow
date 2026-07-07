const express = require('express');
const router = express.Router();
const { create, getAllForColumn, getAllForBoard, update, remove } = require('../controllers/taskController');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

router.post('/', create);
router.get('/column/:columnId', getAllForColumn);
router.get('/board/:boardId', getAllForBoard);
router.patch('/:id', update);
router.delete('/:id', remove);

module.exports = router;
