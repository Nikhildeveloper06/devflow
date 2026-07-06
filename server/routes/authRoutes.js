const express = require('express');
const router = express.Router();
const { signup, login } = require('../controllers/authController');
const requireAuth = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);

router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
