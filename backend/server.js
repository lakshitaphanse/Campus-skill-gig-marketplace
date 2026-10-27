require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const milestoneRoutes = require('./routes/milestoneRoutes');

const app = express();

// Connect to Database & auto-seed demo accounts
connectDB().then(() => {
  const seedDemoAccounts = require('./config/seedData');
  seedDemoAccounts();
});

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/milestones', milestoneRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[Server] Campus Skill & Gig Marketplace API running on port ${PORT}`);
});

module.exports = { app, server };
