require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const pool = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const boardRoutes = require('./routes/boardRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);

app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check route — confirms server is alive
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DevFlow API is running' });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
