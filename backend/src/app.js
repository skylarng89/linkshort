const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { apiRouter, redirectRouter } = require('./routes/linkRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors()); // Enable CORS
app.use(helmet()); // Set security-related HTTP headers
app.use(morgan('dev')); // HTTP request logger middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Mount API routes
app.use('/api', apiRouter);

// Basic route for testing (can be removed or kept)
app.get('/health', (req, res) => { // Changed from '/' to '/health' to avoid conflict with redirect
  res.status(200).json({ status: 'success', message: 'LinkShort Backend is running!' });
});

// Mount redirect routes - this should be AFTER specific API routes
// and ideally before the general error handler if it might catch valid short codes as 404s.
// However, the redirect handler itself handles 404s for non-existent short codes.
app.use('/', redirectRouter);


// Centralized error handling middleware - should be last
app.use(errorHandler);

module.exports = app;
