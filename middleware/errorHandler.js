const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      error: 'Validation Error',
      details: errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      error: 'Duplicate Entry',
      details: `${field} already exists`
    });
  }

  // OpenAI API errors
  if (err.response?.status === 429) {
    return res.status(429).json({
      error: 'Rate Limit Exceeded',
      details: 'Too many requests to AI service. Please try again later.'
    });
  }

  if (err.response?.status === 401) {
    return res.status(500).json({
      error: 'AI Service Configuration Error',
      details: 'The AI service is not properly configured.'
    });
  }

  // JWT errors (if implementing auth later)
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid Token',
      details: 'Authentication token is invalid'
    });
  }

  // Default error
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
