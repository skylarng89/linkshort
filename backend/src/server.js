require('dotenv').config();
const app = require('./app');
const { connectRedis } = require('./config/redis');
const db = require('./config/database'); // Import database configuration

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to Redis
    await connectRedis();

    // Test database connection (optional, pool connects lazily)
    await db.query('SELECT NOW()');
    console.log('Database connection successful');

    // Start the Express server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1); // Exit if critical connections fail
  }
}

startServer();
