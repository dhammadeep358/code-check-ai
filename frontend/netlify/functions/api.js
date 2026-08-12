/**
 * Netlify Function entry point. Wraps the existing Express app (unchanged
 * routes/controllers/services from backend/src) with serverless-http.
 *
 * Netlify redirects /api/* -> /.netlify/functions/api/:splat (see
 * netlify.toml), so routes here are mounted WITHOUT the /api prefix.
 */
require('dotenv').config();
const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');


// const authRoutes = require('../../backend/src/routes/authRoutes');
// const reviewRoutes = require('../../backend/src/routes/reviewRoutes');
// const { notFound, errorHandler } = require('../../backend/src/middleware/errorMiddleware');
// const authRoutes = require('../../../backend/src/routes/authRoutes');
// const reviewRoutes = require('../../../backend/src/routes/reviewRoutes');
// const { notFound, errorHandler } = require('../../../backend/src/middleware/errorMiddleware');
const authRoutes = require('./backend-src/routes/authRoutes');
   const reviewRoutes = require('./backend-src/routes/reviewRoutes');
   const { notFound, errorHandler } = require('./backend-src/middleware/errorMiddleware');

   
const app = express();

const allowedOrigin = process.env.FRONTEND_URL || '*';
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'AI Code Review Assistant API is running' });
});

app.use('/auth', authRoutes);
app.use('/review', reviewRoutes);

app.use(notFound);
app.use(errorHandler);

// Reuse the MongoDB connection across warm function invocations instead of
// reconnecting on every request.
let isConnected = false;
async function ensureDbConnection() {
  if (isConnected && mongoose.connection.readyState === 1) return;

  // await mongoose.connect(process.env.MONGODB_URI);
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  isConnected = true;
}

const serverlessHandler = serverless(app);

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await ensureDbConnection();
  return serverlessHandler(event, context);
};
