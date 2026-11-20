const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const departmentRoutes = require('./routes/departments');
const issueRoutes = require('./routes/issues');
const reservationRoutes = require('./routes/reservations');
const billingRoutes = require('./routes/billing');
const analyticsRoutes = require('./routes/analytics');
const noticeRoutes = require('./routes/notices');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');
const bcrypt = require('bcrypt');
const pool = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'LULL PATHAGAR API is running' }));

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

const PORT = process.env.PORT || 5000;

async function ensureDemoAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@lullpathagar.edu').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'password';
  const name = process.env.ADMIN_NAME || 'Library Administrator';
  const phone = process.env.ADMIN_PHONE || '01800000000';
  const [rows] = await pool.query('SELECT user_id, role FROM users WHERE email = ?', [email]);
  const hash = await bcrypt.hash(password, 10);
  if (rows.length === 0) {
    await pool.query("INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, 'admin')", [name, email, hash, phone]);
    console.log(`Demo admin created: ${email}`);
  } else {
    await pool.query("UPDATE users SET password = ?, role = 'admin' WHERE user_id = ?", [hash, rows[0].user_id]);
    console.log(`Demo admin credentials refreshed: ${email}`);
  }
}

async function startServer() {
  try {
    await pool.query('SELECT 1');
    await ensureDemoAdmin();
    app.listen(PORT, '0.0.0.0', () => console.log(`LULL PATHAGAR backend running on port ${PORT}`));
    } catch (err) {
    console.error('Unable to start LULL PATHAGAR backend:');
    console.error(err);
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    process.exit(1);
  }
}

startServer();
