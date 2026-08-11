function notFound(req, res, next) {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Never log secrets, tokens, or passwords
  const safeMessage = err.message || 'Server error';
  console.error('Error:', safeMessage);

  let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
  }
  // Mongoose duplicate key (e.g. email already registered)
  if (err.code === 11000) {
    statusCode = 409;
    return res.status(statusCode).json({
      success: false,
      message: 'A record with that value already exists (duplicate email).',
    });
  }
  // Multer file errors
  if (err.name === 'MulterError') {
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    message: safeMessage,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}

module.exports = { notFound, errorHandler };
