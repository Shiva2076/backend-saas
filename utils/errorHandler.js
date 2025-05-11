module.exports = (err, req, res, next) => {
  console.error(err.stack);

  // Handle JWT errors
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Validation error',
      errors: err.errors 
    });
  }

  // Default error response
  res.status(500).json({
    message: err.message || 'Something went wrong',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
};