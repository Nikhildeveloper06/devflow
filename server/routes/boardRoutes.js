const express = require('express');
const router = express.Router();
const { create, getAll, getOne, remove } = require('../controllers/boardController');
const requireAuth = require('../middleware/auth');

// All board routes require a logged-in user
router.use(requireAuth);

router.post('/', create);
router.get('/', getAll);
router.get('/:id', getOne);
router.delete('/:id', remove);

module.exports = router;
