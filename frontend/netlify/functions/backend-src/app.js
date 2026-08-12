const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// CORS - only allow the configured frontend origin
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin, credentials: true }));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'AI Code Review Assistant API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/review', reviewRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
