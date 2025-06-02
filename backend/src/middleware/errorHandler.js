// Centralized Error Handling Middleware
// This middleware catches errors passed by next(err) and unhandled errors.

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('Error caught by error handler:');
  console.error('Message:', err.message);
  if (err.stack) {
    console.error('Stack:', err.stack);
  }
  if (err.status) {
    console.error('Status:', err.status);
  }
  if (err.errors) { // For validation errors (e.g., from Joi)
    console.error('Validation Errors:', err.errors);
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // For Joi validation errors, provide more specific feedback
  if (err.isJoi === true) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: err.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      })),
    });
  }
  
  // For other operational errors, send a structured response
  if (statusCode < 500) { // Client-side errors (4xx)
     return res.status(statusCode).json({
        status: 'error',
        message: message,
     });
  }

  // For server-side errors (5xx), avoid leaking stack trace in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred. Please try again later.',
    });
  }

  // In development, send more details
  return res.status(statusCode).json({
    status: 'error',
    message: message,
    stack: err.stack, // Include stack trace in development
  });
}

module.exports = errorHandler;
