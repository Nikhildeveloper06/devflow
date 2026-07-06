const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail } = require('../models/userModel');

const SALT_ROUNDS = 10;

async function signup(req, res) {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are all required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists' });
    }

    // Hash the password — never store plain text
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create the user
    const newUser = await createUser(name, email, passwordHash);

    // Generate a JWT so the user is immediately logged in after signup
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      user: newUser,
      token
    });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong during signup' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    // Find the user
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Compare submitted password against stored hash
    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Issue a fresh token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, created_at: user.created_at },
      token
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong during login' });
  }
}

module.exports = { signup, login };
