const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// TODO: Import routes
// const linkRoutes = require('./routes/linkRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors()); // Enable CORS
app.use(helmet()); // Set security-related HTTP headers
app.use(morgan('dev')); // HTTP request logger middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// TODO: Mount routes
// app.use('/api/links', linkRoutes);
// app.use('/', redirectRoute); // For root-level short code redirects

// Basic route for testing
app.get('/', (req, res) => {
  res.send('LinkShort Backend is running!');
});

// Centralized error handling middleware - should be last
app.use(errorHandler);

module.exports = app;
